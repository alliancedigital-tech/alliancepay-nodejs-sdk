import { z } from 'zod';

export const OrderResponseSchema = z.object({
    hppOrderId: z.string().nonempty(),
    merchantRequestId: z.string().nonempty(),
    hppPayType: z.string().nonempty(),
    paymentMethods: z.array(z.string()).nonempty(),
    orderStatus: z.string().nonempty(),
    coinAmount: z.number(),
    merchantId: z.string().nonempty(),
    redirectUrl: z.url(),
    statusUrl: z.url(),
    nbuQrCode: z.url().optional().nullable(),
    expiredOrderDate: z.union([z.string(), z.instanceof(Date)]).optional(),
    createDate: z.union([z.string(), z.instanceof(Date)]).optional(),
});

export type OrderResponseDto = z.infer<typeof OrderResponseSchema>;
