import { z } from 'zod';
import { INTERVAL_UNIT, SUBSCRIPTION_CURRENCY } from '../../../core/constants/api';

export const PlanRuleSchema = z.object({
    paymentNumberFrom: z.number().int().min(1),
    paymentNumberTo: z.number().int().min(1),
    intervalValue: z.number().int().positive(),
    intervalUnit: z.enum([INTERVAL_UNIT.DAY, INTERVAL_UNIT.WEEK, INTERVAL_UNIT.MONTH]),
    coinAmount: z.number().int().min(0),
    currency: z.literal(SUBSCRIPTION_CURRENCY, { message: 'subscriptions support only UAH (980)' }),
}).superRefine((rule, ctx) => {
    if (rule.paymentNumberTo < rule.paymentNumberFrom) {
        ctx.addIssue({
            code: 'custom',
            path: ['paymentNumberTo'],
            message: 'paymentNumberTo must be greater than or equal to paymentNumberFrom',
        });
    }
});

export const PlanRequestSchema = z.object({
    merchantId: z.string().min(1).max(36),
    planId: z.string().min(1).optional(),
    name: z.string().min(1).max(255),
    description: z.string().trim().min(1, { message: 'description must not be blank' }).max(1000),
    categorySubcategoryIndicator: z.string().optional(),
    rules: z.array(PlanRuleSchema).nonempty(),
});

export const PlanUpdateRequestSchema = PlanRequestSchema.extend({
    planId: z.string().min(1),
});

export type PlanRuleDto = z.infer<typeof PlanRuleSchema>;
export type PlanRequestDto = z.infer<typeof PlanRequestSchema>;
export type PlanUpdateRequestDto = z.infer<typeof PlanUpdateRequestSchema>;
