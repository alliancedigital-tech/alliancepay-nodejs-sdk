import { z } from 'zod';
import { PlanRuleSchema } from './plan-request.dto';

export const GetPlanRequestSchema = z.object({
    merchantId: z.string().min(1).max(36),
    planId: z.string().min(1),
});

/** The bank serialises Map<int, T> here: an object keyed by "1", "2"… instead of an array. */
function toList(value: unknown): unknown {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
    return value;
}

const VersionSchema = z.object({
    versionId: z.number().int(),
    appliesDateTimeFrom: z.string().optional(),
    rules: z.preprocess(toList, z.array(PlanRuleSchema)),
});

export const PlanDetailsSchema = z.object({
    merchantId: z.string(),
    plan: z.object({
        planId: z.string(),
        name: z.string(),
        description: z.string().optional(),
        status: z.string(),
        categorySubcategoryIndicator: z.string().optional(),
        createdAt: z.string().optional(),
        updatedAt: z.string().optional(),
    }),
    versions: z.preprocess(toList, z.array(VersionSchema)),
    subscriptionStatistics: z.object({
        pending: z.number(),
        success: z.number(),
        fail: z.number(),
        canceled: z.number(),
    }).optional(),
});

export type GetPlanRequestDto = z.infer<typeof GetPlanRequestSchema>;
export type PlanDetailsDto = z.infer<typeof PlanDetailsSchema>;
