import { z } from 'zod';
import { PlanRuleSchema } from './plan-request.dto';

/** Bank dates look like `2026-09-30 15:47:56.68+03:00` (space instead of `T`). */
export function parseBankDate(value: string): Date {
    return new Date(value.trim().replace(' ', 'T'));
}

export const PlanResponseSchema = z.object({
    planId: z.string(),
    versionId: z.number().int(),
    merchantId: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    rules: z.array(PlanRuleSchema.or(z.looseObject({}))),
    appliesDateTimeFrom: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type PlanResponseDto = z.infer<typeof PlanResponseSchema>;
