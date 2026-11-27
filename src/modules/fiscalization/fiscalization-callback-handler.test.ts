import { describe, it, expect, vi, afterEach } from 'vitest';
import { FiscalizationCallbackHandler } from './fiscalization-callback-handler';
import { JwsVerifier } from '../../core/jws/jws-verifier';
import { JwsVerificationException } from '../../core/exceptions/base.exception';
import { ValidationException } from '../../core/exceptions/validation.exception';
import { parseBankDate } from '../subscription/dto/plan-response.dto';
import { shouldApplyFiscalizationUpdate } from './fiscalization-status';
import prodSuccess from './__fixtures__/callback-success.json';

const opts = { baseUrl: 'https://bank.test' };
const unsigned = { ...opts, allowUnsigned: true };
const handler = new FiscalizationCallbackHandler();

afterEach(() => vi.restoreAllMocks());

describe('FiscalizationCallbackHandler', () => {
    it('verifies a compact JWS first and parses the verified payload', async () => {
        const spy = vi.spyOn(JwsVerifier, 'verify').mockResolvedValue({
            operationId: 'op-1', merchantRequestId: 'r-1', status: 'SUCCESS', fiscalNumber: 'FN1', receiptUrl: 'https://r.test/1',
        });
        const cb = await handler.handle('aaa.bbb.ccc', opts);
        expect(spy).toHaveBeenCalledWith('aaa.bbb.ccc', expect.objectContaining({ baseUrl: opts.baseUrl }));
        expect(cb.data).toMatchObject({ operationId: 'op-1', status: 'SUCCESS', fiscalNumber: 'FN1' });
    });

    it('rejects an invalid signature without parsing anything', async () => {
        vi.spyOn(JwsVerifier, 'verify').mockRejectedValue(new JwsVerificationException('bad signature', 'JWS_VERIFICATION_FAILED'));
        await expect(handler.handle('aaa.bbb.ccc', opts)).rejects.toBeInstanceOf(JwsVerificationException);
    });

    it('accepts a callback with only operationId (missing fields are fine)', async () => {
        const cb = await handler.handle({ operationId: 'op-1' }, unsigned);
        expect(cb.data.status).toBeUndefined();
        expect(cb.has('fiscalNumber')).toBe(false);
    });

    it('falls back to merchantRequestId when operationId is absent', async () => {
        const cb = await handler.handle({ merchantRequestId: 'r-1', status: 'FAIL', errorCode: '541' }, unsigned);
        expect(cb.data.merchantRequestId).toBe('r-1');
    });

    it('distinguishes absent from null', async () => {
        const cb = await handler.handle({ operationId: 'op-1', fiscalNumber: null }, unsigned);
        expect(cb.has('fiscalNumber')).toBe(true);
        expect(cb.getRawPayload()).toHaveProperty('fiscalNumber', null);
    });

    it('rejects payloads without any identifier and non-JSON bodies', async () => {
        await expect(handler.handle({ status: 'SUCCESS' }, unsigned)).rejects.toBeInstanceOf(ValidationException);
        await expect(handler.handle('not json', unsigned)).rejects.toBeInstanceOf(ValidationException);
        await expect(handler.handle(42, unsigned)).rejects.toBeInstanceOf(ValidationException);
    });

    it('rejects a JSON array payload', async () => {
        await expect(handler.handle('[1,2]', unsigned)).rejects.toBeInstanceOf(ValidationException);
    });

    it('rejects unsigned bodies by default', async () => {
        const forged = { operationId: 'op-1', status: 'SUCCESS', receiptUrl: 'https://evil.test' };
        await expect(handler.handle(forged, opts)).rejects.toBeInstanceOf(ValidationException);
        await expect(handler.handle(JSON.stringify(forged), opts)).rejects.toBeInstanceOf(ValidationException);
    });

    describe('real SUCCESS callback sample', () => {
        it('parses every field and keeps null error fields', async () => {
            const cb = await handler.handle(prodSuccess, unsigned);
            expect(cb.data).toMatchObject({
                status: 'SUCCESS', operationType: 'PURCHASE', operationId: '1700000000000ExampleOper001',
                fiscalNumber: '1234567890', errorCode: null, errorDescription: null,
                receiptUrl: 'https://receipts.example.com/public/check/1700000000001ExampleBucket01/generate_receipt',
            });
            expect(cb.has('errorCode')).toBe(true);
            expect(cb.data.products).toHaveLength(1);
        });

        it('parses it from a JSON string body too', async () => {
            const cb = await handler.handle(JSON.stringify(prodSuccess), unsigned);
            expect(cb.data.merchantRequestId).toBe('00000000-0000-4000-8000-000000000002');
        });

        it('parses bank dates with microseconds, millis and no fraction, honouring +03:00', () => {
            expect(parseBankDate(prodSuccess.creationDateTime).toISOString()).toBe('2026-10-22T08:14:55.242Z');
            expect(parseBankDate(prodSuccess.fiscalizationDateTime).toISOString()).toBe('2026-10-22T08:14:58.000Z');
            expect(parseBankDate(prodSuccess.fiscalizationModificationDateTime).toISOString()).toBe('2026-10-22T08:14:58.951Z');
        });

        it('is not downgraded by a later PENDING and applies over a stored PENDING', () => {
            expect(shouldApplyFiscalizationUpdate({ status: 'SUCCESS', ...pick(prodSuccess) }, { status: 'PENDING' })).toBe(false);
            expect(shouldApplyFiscalizationUpdate({ status: 'PENDING', fiscalizationModificationDateTime: '2026-10-22T11:14:50+03:00' }, prodSuccess)).toBe(true);
            // replayed older delivery is ignored
            expect(shouldApplyFiscalizationUpdate({ status: 'PENDING', fiscalizationModificationDateTime: '2026-10-22T11:15:00+03:00' }, prodSuccess)).toBe(false);
        });
    });
});

const pick = (d: typeof prodSuccess) => ({ fiscalizationModificationDateTime: d.fiscalizationModificationDateTime });
