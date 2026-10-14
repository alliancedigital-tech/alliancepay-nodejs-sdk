import { describe, it, expect, vi, afterEach } from 'vitest';
import { SubscriptionCallbackHandler } from './subscription-callback-handler';
import { JwsVerifier } from '../../core/jws/jws-verifier';
import { ValidationException } from '../../core/exceptions/validation.exception';

const opts = { baseUrl: 'https://bank.test' };
const handler = new SubscriptionCallbackHandler();

afterEach(() => vi.restoreAllMocks());

describe('SubscriptionCallbackHandler', () => {
    it('accepts a delivery without operation', async () => {
        const cb = await handler.handle({ hppOrderId: 'h1', orderStatus: 'PENDING' }, opts);
        expect(cb.getOperation()).toBeUndefined();
        expect(cb.isInitialPayment()).toBe(true);
    });
    it('detects recurring payments', async () => {
        const cb = await handler.handle({ hppOrderId: 'h1', recurringTransactionType: 'SCHEDULED' }, opts);
        expect(cb.isInitialPayment()).toBe(false);
    });
    it('distinguishes absent field from null', async () => {
        const cb = await handler.handle({ hppOrderId: 'h1', scheduledPaymentId: null }, opts);
        expect(cb.has('scheduledPaymentId')).toBe(true);
        expect(cb.has('ecomOrderId')).toBe(false);
    });
    it('reconcileAmount reports mismatch without throwing', async () => {
        const cb = await handler.handle({ hppOrderId: 'h1', operation: { coinAmount: 100 } }, opts);
        expect(cb.reconcileAmount(100).ok).toBe(true);
        expect(cb.reconcileAmount(200)).toMatchObject({ ok: false });
    });
    it('verifies the JWS signature before parsing', async () => {
        const spy = vi.spyOn(JwsVerifier, 'verify').mockRejectedValue(new Error('bad signature'));
        await expect(handler.handle('aaa.bbb.ccc', opts)).rejects.toThrow('bad signature');
        expect(spy).toHaveBeenCalled();
    });
    it('rejects missing hppOrderId and non-JSON bodies', async () => {
        await expect(handler.handle({}, opts)).rejects.toBeInstanceOf(ValidationException);
        await expect(handler.handle('not json', opts)).rejects.toBeInstanceOf(ValidationException);
    });
});
