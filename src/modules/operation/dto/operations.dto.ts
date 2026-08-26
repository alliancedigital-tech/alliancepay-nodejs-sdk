import { z } from 'zod';
import { OPERATION_TYPES } from "../../../core/constants/api";

function numericLike<T extends z.ZodTypeAny>(schema: T) {
    return z.preprocess((val) => {
        if (typeof val === 'string') {
            const trimmed = val.trim();
            if (trimmed === '') return undefined;
            const num = Number(trimmed);
            return Number.isNaN(num) ? val : num;
        }
        return val;
    }, schema);
}

export const BaseOperationSchema = z.object({
    rrn: z.string().trim().optional(),
    coinAmount: z.number(),
    merchantId: z.string().trim().min(1, "is required and couldn't be empty."),
    operationId: z.string().trim().optional(),
    ecomOperationId: z.string().trim().min(1, "is required and couldn't be empty."),
    status: z.string().trim().min(1, "is required and couldn't be empty."),
    transactionCurrency: z.string().trim().min(1, "is required and couldn't be empty."),
    creationDateTime: z.union([z.string(), z.instanceof(Date)]).optional(),
    modificationDateTime: z.union([z.string(), z.instanceof(Date)]).optional(),
    transactionResponseInfo: z.record(z.any(), z.string()),
    productType: z.string().optional(),
    hppOrderId: z.string().trim().min(1, "is required and couldn't be empty."),
    transactionType: z.number().optional(),
    notificationUrl: z.url().optional().or(z.literal('')),
    notificationEncryption: z.boolean().optional(),
    rrnOriginal: z.string().optional(),
    originalOperationId: z.string().optional(),
    originalCoinAmount: z.number().optional(),
    originalEcomOperationId: z.string().optional(),
    notificationSignature: z.boolean().optional(),
    processingTerminalId: z.string().optional(),
    processingMerchantId: z.string().optional(),
    creatorSystem: z.string().optional(),
    merchantName: z.string().optional(),
    approvalCode: z.string().optional(),
    merchantCommission: z.number().optional(),
    bankCode: z.string().optional(),
    paymentSystem: z.string().optional(),
    paymentServiceType: z.string().optional(),
    externalCardToken: z.string().optional(),
    processingDateTime: z.union([z.string(), z.instanceof(Date)]).optional(),
    sourceAmount: numericLike(z.number().int().optional()),
    sourceCurrencyCode: numericLike(z.number().int().optional()),
    conversionRate: numericLike(z.number().optional()),
});

export const OperationPurchaseSchema = BaseOperationSchema.extend({
    type: z.literal(OPERATION_TYPES.PURCHASE)
});

export const OperationRefundSchema = BaseOperationSchema.extend({
    type: z.literal(OPERATION_TYPES.REFUND)
});

export const OperationA2ASchema = BaseOperationSchema.extend({
    type: z.literal(OPERATION_TYPES.A2A)
});

export const OperationPreAuthSchema = BaseOperationSchema.extend({
    type: z.literal(OPERATION_TYPES.PREAUTH)
});

export const OperationCompletionSchema = BaseOperationSchema.extend({
    type: z.literal(OPERATION_TYPES.COMPLETION),
    rrnPreauth: z.string().nullable().optional(),
    preauthOperationId: z.string().nullable().optional(),
    preauthCoinAmount: z.number().int().nullable().optional(),
    preauthEcomOperationId: z.string().nullable().optional(),
});

export type BaseOperationDto = z.infer<typeof BaseOperationSchema>;
export type OperationPurchaseDto = z.infer<typeof OperationPurchaseSchema>;
export type OperationRefundDto = z.infer<typeof OperationRefundSchema>;
export type OperationA2ADto = z.infer<typeof OperationA2ASchema>;
export type OperationPreAuthDto = z.infer<typeof OperationPreAuthSchema>;
export type OperationCompletionDto = z.infer<typeof OperationCompletionSchema>;

export const OperationSchemaUnion = z.union([
    OperationPurchaseSchema,
    OperationRefundSchema,
    OperationA2ASchema,
    OperationPreAuthSchema,
    OperationCompletionSchema,
]);
