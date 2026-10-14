import { describe, it, expect } from 'vitest';
import { PlanDetailsSchema } from './get-plan.dto';
import { parseBankDate } from './plan-response.dto';

describe('PlanDetailsSchema', () => {
    it('normalises keyed versions/rules objects into arrays', () => {
        const parsed = PlanDetailsSchema.parse({
            merchantId: 'm',
            plan: { planId: 'p', name: 'n', status: 'ACTIVE' },
            versions: {
                '1': {
                    versionId: 1,
                    rules: {
                        '1': { paymentNumberFrom: 1, paymentNumberTo: 2, intervalValue: 2, intervalUnit: 'WEEK', coinAmount: 1300, currency: '980' },
                        '2': { paymentNumberFrom: 3, paymentNumberTo: 5, intervalValue: 22, intervalUnit: 'DAY', coinAmount: 3000, currency: '980' },
                    },
                },
            },
            subscriptionStatistics: { pending: 1, success: 0, fail: 0, canceled: 0 },
        });
        expect(parsed.versions).toHaveLength(1);
        expect(parsed.versions[0].rules).toHaveLength(2);
    });
});

describe('parseBankDate', () => {
    it('parses bank date format', () => {
        expect(Number.isFinite(parseBankDate('2026-09-30 15:47:56.68+03:00').getTime())).toBe(true);
    });
});
