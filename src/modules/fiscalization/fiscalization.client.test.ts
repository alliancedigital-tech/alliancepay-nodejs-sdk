import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { generateKeyPairSync } from 'node:crypto';
import { decodeProtectedHeader, compactVerify, importSPKI } from 'jose';
import { AllianceBankClient } from '../../client';
import { FiscalizationException } from '../../core/exceptions/base.exception';
import { JwsVerifier } from '../../core/jws/jws-verifier';

let privateKeyPem: string;
let publicKeyPem: string;

beforeAll(() => {
    const keys = generateKeyPairSync('ec', {
        namedCurve: 'prime256v1',
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    privateKeyPem = keys.privateKey as unknown as string;
    publicKeyPem = keys.publicKey as unknown as string;
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

const makeClient = (timeoutMs?: number) => new AllianceBankClient({
    authentificationData: { baseUrl: 'https://bank.test', merchantId: 'merchant-1', jwsPrivateKey: privateKeyPem, jwsKeyId: 'kid-ec' },
    timeoutMs,
});

const payload = () => ({
    operationId: 'op-1',
    notificationUrl: 'https://merchant.test/fiscalization/callback',
    products: [{ id: 'p1', name: 'Item', count: 1, measurementCode: '0001', unitPrice: 10 }],
});

describe('AllianceBankClient fiscalization', () => {
    it('signs with ES256, injects merchant ids and calls the cashbox endpoint without x-api_version', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            text: async () => JSON.stringify({ operationId: 'op-1', status: 'PENDING', merchantRequestId: 'echo' }),
        });
        vi.stubGlobal('fetch', fetchMock);

        const response = await makeClient().createFiscalization(payload());

        expect(response.status).toBe('PENDING');
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('https://bank.test/ecom/jws/cashbox/v2/fiscalization/create');
        expect(init.headers['x-api_version']).toBeUndefined();
        expect(init.headers['Content-Type']).toBe('application/jws');

        const header = decodeProtectedHeader(init.body);
        expect(header).toMatchObject({ alg: 'ES256', kid: 'kid-ec', targetUrl: '/ecom/jws/cashbox/v2/fiscalization/create' });

        const { payload: signed } = await compactVerify(init.body, await importSPKI(publicKeyPem, 'ES256'));
        const body = JSON.parse(new TextDecoder().decode(signed));
        expect(body.merchantId).toBe('merchant-1');
        expect(body.merchantRequestId).toMatch(/^[0-9a-f-]{36}$/);
        expect(body.operationId).toBe('op-1');
    });

    it('generates a new merchantRequestId on every call', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify({ operationId: 'op-1', status: 'PENDING' }) });
        vi.stubGlobal('fetch', fetchMock);
        const client = makeClient();

        await client.createFiscalization(payload());
        await client.createFiscalization(payload());

        const ids = await Promise.all(fetchMock.mock.calls.map(async ([, init]) => {
            const { payload: p } = await compactVerify(init.body, await importSPKI(publicKeyPem, 'ES256'));
            return JSON.parse(new TextDecoder().decode(p)).merchantRequestId;
        }));
        expect(ids[0]).not.toBe(ids[1]);
    });

    it('uses a caller-supplied merchantRequestId (idempotent retry)', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify({ operationId: 'op-1', status: 'PENDING' }) });
        vi.stubGlobal('fetch', fetchMock);

        await makeClient().createFiscalization({ ...payload(), merchantRequestId: 'retry-id-1' });

        const { payload: p } = await compactVerify(fetchMock.mock.calls[0][1].body, await importSPKI(publicKeyPem, 'ES256'));
        expect(JSON.parse(new TextDecoder().decode(p)).merchantRequestId).toBe('retry-id-1');
    });

    it('exposes the used merchantRequestId on timeout', async () => {
        const timeoutError = Object.assign(new Error('timed out'), { name: 'TimeoutError' });
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(timeoutError));

        const err: any = await makeClient().createFiscalization(payload()).catch((e) => e);
        expect(err.code).toBe('REQUEST_TIMEOUT');
        expect(err.rawPayload.merchantRequestId).toEqual(expect.any(String));
    });

    it('rejects an unsigned fiscalization callback by default', async () => {
        await expect(makeClient().handleFiscalizationCallback({ operationId: 'op-1', status: 'SUCCESS' }))
            .rejects.toThrow('Unsigned callback rejected');
    });

    it('surfaces an HTTP 400 business error code', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: false, status: 400,
            text: async () => JSON.stringify({ msgType: 'ERROR', msgCode: 'original_receipt_not_found', msgText: 'No receipt' }),
        }));

        await expect(makeClient().createFiscalization(payload())).rejects.toSatisfy(
            (e: any) => e instanceof FiscalizationException && e.code === 'original_receipt_not_found'
        );
    });

    it('applies the configured timeout', async () => {
        const timeoutError = Object.assign(new Error('timed out'), { name: 'TimeoutError' });
        const fetchMock = vi.fn().mockRejectedValue(timeoutError);
        vi.stubGlobal('fetch', fetchMock);

        await expect(makeClient(2000).createFiscalization(payload())).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT' });
        expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    });

    it('handles a fiscalization callback through the client', async () => {
        vi.spyOn(JwsVerifier, 'verify').mockResolvedValue({ operationId: 'op-1', status: 'SUCCESS', fiscalNumber: 'FN' });
        const cb = await makeClient().handleFiscalizationCallback('aaa.bbb.ccc');
        expect(cb.data).toMatchObject({ operationId: 'op-1', status: 'SUCCESS' });
    });
});
