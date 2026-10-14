import { describe, it, expect } from 'vitest';
import { PlanRequestSchema } from './plan-request.dto';

const rule = { paymentNumberFrom: 1, paymentNumberTo: 2, intervalValue: 1, intervalUnit: 'MONTH', coinAmount: 0, currency: '980' };
const valid = { merchantId: 'm1', name: 'Plan', description: 'Desc', rules: [rule] };

describe('PlanRequestSchema', () => {
    it('accepts a valid plan with a trial rule (coinAmount 0)', () => {
        expect(PlanRequestSchema.safeParse(valid).success).toBe(true);
    });
    it('requires description', () => {
        const { description, ...rest } = valid;
        expect(PlanRequestSchema.safeParse(rest).success).toBe(false);
        expect(PlanRequestSchema.safeParse({ ...valid, description: '  ' }).success).toBe(false);
    });
    it('rejects non-UAH currency', () => {
        expect(PlanRequestSchema.safeParse({ ...valid, rules: [{ ...rule, currency: '840' }] }).success).toBe(false);
    });
    it('rejects paymentNumberTo < paymentNumberFrom', () => {
        expect(PlanRequestSchema.safeParse({ ...valid, rules: [{ ...rule, paymentNumberFrom: 3, paymentNumberTo: 2 }] }).success).toBe(false);
    });
    it('rejects empty rules', () => {
        expect(PlanRequestSchema.safeParse({ ...valid, rules: [] }).success).toBe(false);
    });
});
