import { z } from 'zod';
import { PLAN_STATUS } from '../../../core/constants/api';

export const PlanStatusUpdateRequestSchema = z.object({
    merchantId: z.string().min(1).max(36),
    planId: z.string().min(1),
    status: z.enum([PLAN_STATUS.ACTIVE, PLAN_STATUS.PAUSED, PLAN_STATUS.ARCHIVED]),
});

export const PlanStatusUpdateResponseSchema = z.object({
    planId: z.string(),
    merchantId: z.string(),
    status: z.string(),
});

export type PlanStatusUpdateRequestDto = z.infer<typeof PlanStatusUpdateRequestSchema>;
export type PlanStatusUpdateResponseDto = z.infer<typeof PlanStatusUpdateResponseSchema>;
