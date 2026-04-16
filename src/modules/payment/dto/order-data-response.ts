import { z } from 'zod';

import {
    OperationPurchaseSchema,
    OperationRefundSchema
} from '../../operation/dto/operations.dto';

export const OrderDataResponseSchema = z.object({
    coinAmount: z.number(),
    ecomOrderId: z.string().trim().min(1, "is required and couldn't be empty."),
    statusUrl: z.url().nullable().or(z.literal('')).optional(),
    merchantId: z.string().trim().min(1, "is required and couldn't be empty."),
    hppOrderId: z.string().trim().min(1, "is required and couldn't be empty."),
    redirectUrl: z.url().nullable().or(z.literal('')).optional(),
    hppPayType: z.string().trim().min(1, "is required and couldn't be empty."),
    notificationUrl: z.url().nullable().or(z.literal('')).optional(),
    merchantRequestId: z.string().trim().min(1, "is required and couldn't be empty."),
    expiredOrderDate: z.union([z.string(), z.instanceof(Date)]).nullable().optional(),
    orderStatus: z.string().trim().min(1, "is required and couldn't be empty."),
    paymentMethods: z.array(z.string()).min(1, "is required and couldn't be empty."),
    createDate: z.union([z.string(), z.instanceof(Date)]).nullable().optional(),

    operations: z.array(z.discriminatedUnion("type", [
        OperationPurchaseSchema,
        OperationRefundSchema
    ]))
});

export type OrderDataResponseDto = z.infer<typeof OrderDataResponseSchema>;
