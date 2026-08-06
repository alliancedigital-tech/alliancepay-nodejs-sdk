import {z} from 'zod';

export const CompletionResponseSchema = z.object({
    type: z.string().trim(),
    rrn: z.string().trim().nullable().optional(),
    coinAmount: z.number().int(),
    merchantId: z.string().trim(),
    operationId: z.string().trim().nullable().optional(),
    ecomOperationId: z.string().trim(),
    status: z.string().trim(),
    merchantRequestId: z.string().trim().nullable().optional(),
    transactionCurrency: z.string().trim(),
    creationDateTime: z.union([z.string(), z.instanceof(Date)]).optional(),
    modificationDateTime: z.union([z.string(), z.instanceof(Date)]).optional(),
    transactionResponseInfo: z.record(z.any(), z.string()),
    productType: z.string().trim().nullable().optional(),
    hppOrderId: z.string().trim(),
    transactionType: z.number().optional(),
    notificationUrl: z.url().optional().or(z.literal('')),
    notificationEncryption: z.boolean().optional(),
    notificationSignature: z.boolean().optional(),
    processingTerminalId: z.string().nullable().optional(),
    processingMerchantId: z.string().nullable().optional(),
    creatorSystem: z.string().optional(),
    rrnPreauth: z.string().nullable().optional(),
    preauthOperationId: z.string().nullable().optional(),
    preauthCoinAmount: z.number().int().nullable().optional(),
    preauthEcomOperationId: z.string().nullable().optional(),
});

export type CompletionResponseDto = z.infer<typeof CompletionResponseSchema>;
