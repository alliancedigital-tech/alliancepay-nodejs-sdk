import { z } from 'zod';
import { CustomerDataSchema } from '../../payment/dto/order-request.dto';

// Cancel/trigger responses are not captured yet (see typescript-sdk-subscription-port.md §9.8),
// so only the known keys are validated and everything else passes through.
export const SubscriptionOrderRequestSchema = z.looseObject({
    merchantRequestId: z.string().min(1).max(36),
    merchantId: z.string().min(1).max(36),
    planId: z.string().min(1),
    versionId: z.number().int().positive().optional(),
    successUrl: z.string().max(1000).url(),
    failUrl: z.string().max(1000).url(),
    notificationUrl: z.string().max(255).url().optional(),
    customerData: CustomerDataSchema,
});

// Shape confirmed by a real bank response of subscription-orders/create_v1.
export const SubscriptionOrderResponseSchema = z.looseObject({
    hppOrderId: z.string().min(1),
    merchantRequestId: z.string().optional(),
    orderStatus: z.string().optional(),
    merchantId: z.string().optional(),
    createdAt: z.string().optional(),
    redirectUrl: z.string().url().optional(),
});

export const SubscriptionOrderCancelRequestSchema = z.looseObject({
    merchantRequestId: z.string().min(1).max(36),
    merchantId: z.string().min(1).max(36),
    hppOrderId: z.string().min(1),
});

export const SubscriptionOrderCancelResponseSchema = z.looseObject({});

export const RecurringPaymentTriggerRequestSchema = z.looseObject({
    merchantRequestId: z.string().min(1).max(36),
    merchantId: z.string().min(1).max(36),
    hppOrderId: z.string().min(1),
});

export const RecurringPaymentTriggerResponseSchema = z.looseObject({});

export type SubscriptionOrderRequestDto = z.infer<typeof SubscriptionOrderRequestSchema>;
export type SubscriptionOrderResponseDto = z.infer<typeof SubscriptionOrderResponseSchema>;
export type SubscriptionOrderCancelRequestDto = z.infer<typeof SubscriptionOrderCancelRequestSchema>;
export type SubscriptionOrderCancelResponseDto = z.infer<typeof SubscriptionOrderCancelResponseSchema>;
export type RecurringPaymentTriggerRequestDto = z.infer<typeof RecurringPaymentTriggerRequestSchema>;
export type RecurringPaymentTriggerResponseDto = z.infer<typeof RecurringPaymentTriggerResponseSchema>;
