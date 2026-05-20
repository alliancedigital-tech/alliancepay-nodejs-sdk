import {z} from 'zod';

export const CustomerDataSchema = z.object({
    senderCustomerId: z.string().min(1).max(255),
    senderFirstName: z.string().max(30).optional(),
    senderLastName: z.string().max(30).optional(),
    senderMiddleName: z.string().max(30).optional(),
    senderEmail: z.string().email().max(256).optional(),
    senderCountry: z.string().regex(/^\d{1,3}$/).optional(),
    senderRegion: z.string().max(255).optional(),
    senderCity: z.string().max(25).optional(),
    senderStreet: z.string().max(35).optional(),
    senderAdditionalAddress: z.string().max(255).optional(),
    senderItn: z.string().max(20).optional(),
    senderPassport: z.string().max(255).optional(),
    senderIp: z.string().refine(
        v => z.string().ipv4().safeParse(v).success || z.string().ipv6().safeParse(v).success,
        {message: 'Invalid IP address'}
    ).optional(),
    senderPhone: z.string().max(20).optional(),
    senderBirthday: z.string().max(50).optional(),
    senderGender: z.string().max(50).optional(),
    senderZipCode: z.string().max(50).optional(),
}).strict();

export const OrderRequestSchema = z.object({
    merchantRequestId: z.string().min(1).max(36),
    merchantId: z.string().min(1).max(36),
    hppPayType: z.enum(['A2A', 'PURCHASE']),
    directType: z.string().optional(),
    hppTryMode: z.string().optional(),
    expirationTimeMinutes: z.number().int().max(9999).optional(),
    coinAmount: z.number().int().positive(),
    paymentMethods: z.array(z.string()).nonempty(),
    language: z.string().max(50).optional(),
    notificationUrl: z.string().max(255).url().optional().or(z.literal('')),
    notificationEncryption: z.union([z.boolean(), z.string()]).optional(),
    successUrl: z.string().max(1000).url(),
    failUrl: z.string().max(1000).url(),
    statusPageType: z.string().min(1),
    purpose: z.string().max(255).optional(),
    merchantComment: z.string().max(255).optional(),
    priorityBankCode: z.string().optional(),
    paymentCategoryGoal: z.string().optional(),
    generateQrNbu: z.boolean().optional().default(false),
    customerData: CustomerDataSchema,
}).superRefine((data, ctx) => {
    if (data.hppPayType === 'A2A' && !data.merchantComment) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['merchantComment'],
            message: 'merchantComment is required when hppPayType is A2A',
        });
    }
});

export type OrderRequestDto = z.infer<typeof OrderRequestSchema>;
