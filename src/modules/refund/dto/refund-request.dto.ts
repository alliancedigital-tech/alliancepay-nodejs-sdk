import { z } from 'zod';

export const RefundRequestSchema = z.object({
    merchantRequestId: z.string().nonempty(),
    merchantId: z.string().nonempty(),
    operationId: z.string().nonempty(),
    coinAmount: z.number().positive(),
    date: z.union([z.string(), z.instanceof(Date)]),
    notificationUrl: z.url().optional().or(z.literal('')),
    notificationEncryption: z.string().optional(),
    merchantComment: z.string().optional(),
});

export type RefundRequestDto = z.infer<typeof RefundRequestSchema>;
