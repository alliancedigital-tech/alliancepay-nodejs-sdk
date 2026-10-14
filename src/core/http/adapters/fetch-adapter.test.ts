import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { FetchAdapter } from './fetch-adapter';
import { RequestBuilder } from '../request/request-builder';
import { AuthorizationDto } from '../../../modules/auth/dto/authorization.dto';
import { GeneralApiException } from '../../exceptions/base.exception';
import { JwsSigner } from '../../jws/jws-signer';
import { JwsVerifier } from '../../jws/jws-verifier';

vi.mock('../../jws/jws-signer');
vi.mock('../../jws/jws-verifier');

describe('FetchAdapter', () => {
    let adapter: FetchAdapter;
    const authDto: AuthorizationDto = {
        baseUrl: 'https://api.test.com',
        merchantId: 'm-1',
        jwsPrivateKey: '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----',
        jwsKeyId: 'kid-1',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(JwsSigner.sign).mockResolvedValue('signed.jws.token');
        adapter = new FetchAdapter('https://api.test.com', new RequestBuilder());
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should sign the request body with JwsSigner using the target url as targetUrl', async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
            text: async () => JSON.stringify({ status: 'ok' }),
        });

        await adapter.post('/ecom/jws/payments/hpp/create_order_v1', { coinAmount: 1000 }, authDto);

        expect(JwsSigner.sign).toHaveBeenCalledWith({
            privateKeyPem: authDto.jwsPrivateKey,
            kid: authDto.jwsKeyId,
            targetUrl: '/ecom/jws/payments/hpp/create_order_v1',
            payloadJson: JSON.stringify({ coinAmount: 1000 }),
        });
    });

    it('should send the signed token as the raw request body with application/jws content type', async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
            text: async () => JSON.stringify({ status: 'ok' }),
        });

        await adapter.post('/ecom/jws/payments/hpp/create_order_v1', { coinAmount: 1000 }, authDto);

        const [, requestInit] = (fetch as any).mock.calls[0];
        expect(requestInit.body).toBe('signed.jws.token');
        expect(requestInit.headers['Content-Type']).toBe('application/jws');
    });

    it('should return plain JSON responses parsed as-is', async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
            text: async () => JSON.stringify({ hppOrderId: 'order-1' }),
        });

        const result = await adapter.post('/x', {}, authDto);
        expect(result).toEqual({ hppOrderId: 'order-1' });
    });

    it('should verify a compact-JWS response body via JwsVerifier and return the verified claims', async () => {
        vi.mocked(JwsVerifier.verify).mockResolvedValue({ verified: true });

        (fetch as any).mockResolvedValue({
            ok: true,
            text: async () => 'header.payload.signature',
        });

        const result = await adapter.post('/x', {}, authDto);

        expect(JwsVerifier.verify).toHaveBeenCalledWith('header.payload.signature', expect.objectContaining({ baseUrl: 'https://api.test.com' }));
        expect(result).toEqual({ verified: true });
    });

    it('should throw GeneralApiException with parsed msgCode/msgText on a non-2xx JSON error body', async () => {
        (fetch as any).mockResolvedValue({
            ok: false,
            status: 400,
            text: async () => JSON.stringify({ msgCode: 'b_bad_request', msgText: 'Bad request' }),
        });

        await expect(adapter.post('/x', {}, authDto)).rejects.toThrow(GeneralApiException);
    });

    it('should throw GeneralApiException with a fallback message on a non-2xx non-JSON error body', async () => {
        (fetch as any).mockResolvedValue({
            ok: false,
            status: 500,
            text: async () => 'internal error',
        });

        await expect(adapter.post('/x', {}, authDto)).rejects.toThrow(GeneralApiException);
    });
});
