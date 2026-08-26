import {z} from 'zod';
import {DateTimeProvider} from '../../../core/utils/date-time.provider';
import {CURRENCY_CODES, HPP_PAY_TYPES, SUPPORTED_CURRENCY_CODES} from "../../../core/constants/api";

export const HppProductSchema = z.object({
    name: z.string(),
    count: z.number().int(),
    sum: z.number().int(),
});

export const HppPageAdditionalInfoSchema = z.object({
    productsSum: z.number().int().optional(),
    products: z.array(HppProductSchema).optional(),
}).optional().nullable();

export type HppPageAdditionalInfo = z.infer<typeof HppPageAdditionalInfoSchema>;

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

const PREAUTH_EXP_DATE_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{2}[+-]\d{2}:\d{2}$/;

export const OrderRequestSchema = z.object({
    merchantRequestId: z.string().min(1).max(36),
    merchantId: z.string().min(1).max(36),
    hppPayType: z.enum([HPP_PAY_TYPES.A2A, HPP_PAY_TYPES.PURCHASE, HPP_PAY_TYPES.PREAUTH]),
    directType: z.enum(['REDIRECT', 'BANK_LINK']).optional(),
    hppTryMode: z.string().optional(),
    expirationTimeMinutes: z.number().int().min(60).max(1440).optional(),
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
    hppPageAdditionalInfo: HppPageAdditionalInfoSchema,
    priorityBankCode: z.string().optional(),
    paymentCategoryGoal: z.string().optional(),
    generateQrNbu: z.boolean().optional().default(false),
    customerData: CustomerDataSchema,
    preAuthExpDate: z.string().nullable().default(null),
    currencyCode: z.number().refine(
        (code): code is typeof SUPPORTED_CURRENCY_CODES[number] => (SUPPORTED_CURRENCY_CODES as readonly number[]).includes(code),
        {message: `currencyCode must be one of: ${SUPPORTED_CURRENCY_CODES.join(', ')}`}
    ).optional().default(CURRENCY_CODES.UAH),
}).superRefine((data, ctx) => {
    if (data.hppPayType === HPP_PAY_TYPES.A2A && !data.merchantComment) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['merchantComment'],
            message: 'merchantComment is required when hppPayType is A2A',
        });
    }
    if (data.hppPayType === HPP_PAY_TYPES.A2A && !data.directType) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['directType'],
            message: 'directType is required when hppPayType is A2A',
        });
    }
    if (data.hppPayType === HPP_PAY_TYPES.A2A && data.currencyCode !== CURRENCY_CODES.UAH) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['currencyCode'],
            message: 'A2A payment type supports only UAH (980)',
        });
    }
    if (data.hppPayType === HPP_PAY_TYPES.PREAUTH && data.preAuthExpDate !== null) {
        if (!PREAUTH_EXP_DATE_REGEX.test(data.preAuthExpDate)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['preAuthExpDate'],
                message: 'preAuthExpDate must be in format YYYY-MM-DD HH:mm:ss.SS+HH:MM'
                    + ' (e.g. 2025-11-13 15:01:54.56+02:00)',
            });
            return;
        }

        const expDate = new Date(data.preAuthExpDate.replace(' ', 'T'));

        if (!Number.isFinite(expDate.getTime())) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['preAuthExpDate'],
                message: 'preAuthExpDate is not a valid calendar date',
            });
            return;
        }

        const now = new Date();
        const minDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const maxDate = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

        if (expDate <= minDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['preAuthExpDate'],
                message: 'preAuthExpDate must be at least 2 hours from now',
            });
        }
        if (expDate >= maxDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['preAuthExpDate'],
                message: 'preAuthExpDate must be within 28 days from now',
            });
        }
    }
});

export type OrderRequestDto = z.infer<typeof OrderRequestSchema>;
