import { describe, it, expect } from 'vitest';
import { SubscriptionOrderResponseSchema } from './subscription-order.dto';

describe('SubscriptionOrderResponseSchema', () => {
    it('parses a real create_v1 response', () => {
        const parsed = SubscriptionOrderResponseSchema.parse({
            hppOrderId: '1790938242101o05WYcIFxiB',
            merchantRequestId: '0f631b43-d772-4342-a5ee-91a0fe15d06a',
            orderStatus: 'PENDING',
            merchantId: '137d9304-0368-11ed-b939-0242ac120002',
            createdAt: '2026-10-02 13:50:42.04+03:00',
            redirectUrl: 'https://prde-pgi-ecom.develop.bankalliance.ua/?hpp_id=1790938242101o05WYcIFxiB',
        });
        expect(parsed.hppOrderId).toBe('1790938242101o05WYcIFxiB');
        expect(parsed.redirectUrl).toContain('hpp_id=');
    });
    it('requires hppOrderId', () => {
        expect(SubscriptionOrderResponseSchema.safeParse({ orderStatus: 'PENDING' }).success).toBe(false);
    });
});
