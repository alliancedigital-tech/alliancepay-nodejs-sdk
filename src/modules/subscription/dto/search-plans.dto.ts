import { z } from 'zod';

export const SearchPlansRequestSchema = z.object({
    merchantId: z.string().min(1).max(36),
    page: z.number().int().min(0).optional(),
    pageSize: z.number().int().positive().optional(),
    name: z.string().optional(),
    status: z.string().optional(),
}).loose();

export const PlanSummarySchema = z.object({
    planId: z.string(),
    name: z.string(),
    description: z.string().optional(),
    status: z.string(),
    categorySubcategoryIndicator: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export const SearchPlansResponseSchema = z.object({
    currentPage: z.number().int(),
    totalPages: z.number().int().optional(),
    pageSize: z.number().int().optional(),
    plans: z.array(PlanSummarySchema),
});

export type SearchPlansRequestDto = z.infer<typeof SearchPlansRequestSchema>;
export type SearchPlansResponseDto = z.infer<typeof SearchPlansResponseSchema>;
