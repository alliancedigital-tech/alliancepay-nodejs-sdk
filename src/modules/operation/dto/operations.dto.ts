import { z } from 'zod';
import { OPERATION_TYPES } from "../../../core/constants/api";

export const BaseOperationSchema = z.object({
    rrn: z.string().trim().min(1, "is required and couldn't be empty."),
    coinAmount: z.number(),
    merchantId: z.string().trim().min(1, "is required and couldn't be empty."),
    operationId: z.string().trim().min(1, "is required and couldn't be empty."),
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
});

export const OperationPurchaseSchema = BaseOperationSchema.extend({
    type: z.literal(OPERATION_TYPES.PURCHASE)
});

export const OperationRefundSchema = BaseOperationSchema.extend({
    type: z.literal(OPERATION_TYPES.REFUND)
});

export type BaseOperationDto = z.infer<typeof BaseOperationSchema>;
export type OperationPurchaseDto = z.infer<typeof OperationPurchaseSchema>;
export type OperationRefundDto = z.infer<typeof OperationRefundSchema>;

export const OperationSchemaUnion = z.union([
    OperationPurchaseSchema,
    OperationRefundSchema
]);
