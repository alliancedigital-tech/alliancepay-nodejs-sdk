import { z } from 'zod';

export const PlanVersionUpdateRequestSchema = z.object({
    planId: z.string().min(1),
    versionId: z.number().int().positive(),
    infiniteVersion: z.literal(true),
});

export const PlanVersionDeleteRequestSchema = z.object({
    planId: z.string().min(1),
    versionId: z.number().int().positive(),
});

export const PlanVersionDeleteResponseSchema = z.object({
    planId: z.string(),
    versionId: z.number().int(),
    versionStatus: z.string(),
});

export type PlanVersionUpdateRequestDto = z.infer<typeof PlanVersionUpdateRequestSchema>;
export type PlanVersionDeleteRequestDto = z.infer<typeof PlanVersionDeleteRequestSchema>;
export type PlanVersionDeleteResponseDto = z.infer<typeof PlanVersionDeleteResponseSchema>;
