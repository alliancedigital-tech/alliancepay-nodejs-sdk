import { z } from 'zod';

export const CustomerDataSchema = z.object({
    senderCustomerId: z.string().nonempty(),
}).loose();

export const OrderRequestSchema = z.object({
    merchantRequestId: z.string().min(1),
    merchantId: z.string().min(1),
    hppPayType: z.string().min(1),
    coinAmount: z.number().positive(),
    paymentMethods: z.array(z.string()).nonempty(),
    successUrl: z.url(),
    failUrl: z.url(),
    statusPageType: z.string().min(1),
    merchantComment: z.string().optional(),
    directType: z.string().optional(),
    hppTryMode: z.string().optional(),
    expirationTimeMinutes: z.number().optional(),
    language: z.string().optional(),
    notificationUrl: z.url().optional().or(z.literal('')),
    notificationEncryption: z.union([z.boolean(), z.string()]).optional(),
    purpose: z.string().optional(),
    priorityBankCode: z.string().optional(),
    paymentCategoryGoal: z.string().optional(),
    generateQrNbu: z.boolean().optional().default(false),
    nbuQrCode: z.string().optional().optional(),
    customerData: CustomerDataSchema
});

export type OrderRequestDto = z.infer<typeof OrderRequestSchema>;
