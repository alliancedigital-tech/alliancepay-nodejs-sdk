import { z } from 'zod';
import {
    OperationPurchaseSchema,
    OperationRefundSchema,
    OperationA2ASchema,
    OperationPreAuthSchema,
    OperationCompletionSchema,
} from "../../operation/dto/operations.dto";

export const CallbackSchema = z.object({
    ecomOrderId: z.string().trim().nonempty(),
    coinAmount: z.number(),
    merchantId: z.string().trim().nonempty(),
    statusUrl: z.url({ message: "must be a valid URL" }).nullable(),
    redirectUrl: z.url({ message: "must be a valid URL" }),
    notificationUrl: z.url({ message: "must be a valid URL" }),
    notificationEncryption: z.boolean().optional(),
    hppOrderId: z.string().trim().nonempty(),
    hppDirectType: z.string().optional(),
    merchantRequestId: z.string().trim().nonempty(),
    createDate: z.union([z.string(), z.instanceof(Date)]).optional(),
    paymentMethods: z.array(z.string()).nonempty(),
    orderStatus: z.string().trim().nonempty(),
    expiredOrderDate: z.union([z.string(), z.instanceof(Date)]).optional(),
    operation: z.discriminatedUnion("type", [
        OperationPurchaseSchema,
        OperationRefundSchema,
        OperationA2ASchema,
        OperationPreAuthSchema,
        OperationCompletionSchema,
    ])
});

export type CallbackDto = z.infer<typeof CallbackSchema>;
