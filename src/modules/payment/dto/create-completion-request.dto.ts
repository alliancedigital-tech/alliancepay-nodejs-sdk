import {z} from 'zod';

export const CompletionRequestSchema = z.object({
    merchantRequestId: z.string().nonempty(),
    merchantId: z.string().nonempty(),
    originalOperationId: z.string().nonempty(),
    coinAmount: z.number().int().positive(),
    date: z.string().nonempty(),
    notificationUrl: z.url().optional().or(z.literal('')),
});

export type CompletionRequestDto = z.infer<typeof CompletionRequestSchema>;
