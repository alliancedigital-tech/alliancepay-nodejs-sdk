import { z } from 'zod';
import {
    FISCAL_CLASSIFICATION_REQUIRED_TAX_CODES,
    FISCAL_MAX_STRING_LENGTH,
} from '../fiscalization.constants';

const hasMaxDecimals = (maxDecimals: number) => (value: number): boolean => {
    const factor = 10 ** maxDecimals;
    return Math.abs(Math.round(value * factor) - value * factor) < 1e-6;
};

const idSchema = z.preprocess(
    (value) => (typeof value === 'number' ? String(value) : value),
    z.string().trim().min(1).max(FISCAL_MAX_STRING_LENGTH)
);

export const FiscalProductSchema = z.object({
    id: idSchema,
    name: z.string().trim().min(1).max(FISCAL_MAX_STRING_LENGTH),
    count: z.number().positive().refine(hasMaxDecimals(3), 'must have at most 3 decimal places'),
    measurementCode: z.string().trim().min(1),
    /** UAH (hryvnias), not coins. */
    unitPrice: z.number().positive().refine(hasMaxDecimals(2), 'must have at most 2 decimal places'),
    taxCode: z.number().int().positive().optional(),
    classificationCode: z.string().trim().regex(/^\d+$/, 'must contain digits only').optional(),
    exciseLabels: z.array(z.string().trim().min(1)).min(1).optional(),
}).superRefine((product, ctx) => {
    if (
        product.taxCode !== undefined
        && FISCAL_CLASSIFICATION_REQUIRED_TAX_CODES.includes(product.taxCode)
        && !product.classificationCode
    ) {
        ctx.addIssue({
            code: 'custom',
            path: ['classificationCode'],
            message: `classificationCode is required when taxCode is ${FISCAL_CLASSIFICATION_REQUIRED_TAX_CODES.join(', ')}`,
        });
    }
});

export const FiscalizationRequestSchema = z.object({
    merchantRequestId: z.string().min(1).max(36),
    merchantId: z.string().min(1).max(36),
    operationId: z.string().trim().min(1).max(64),
    receiptComment: z.string().max(FISCAL_MAX_STRING_LENGTH).optional(),
    notificationUrl: z.string().max(FISCAL_MAX_STRING_LENGTH).url(),
    products: z.array(FiscalProductSchema).min(1),
});

export type FiscalProductDto = z.infer<typeof FiscalProductSchema>;
export type FiscalizationRequestDto = z.infer<typeof FiscalizationRequestSchema>;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === 'object' && !Array.isArray(value);

/** Drops null/undefined fields and empty `exciseLabels`, so nothing optional is sent as null. */
export function normalizeFiscalizationRequest(request: unknown): unknown {
    if (!isPlainObject(request)) return request;

    const clean = (source: Record<string, unknown>): Record<string, unknown> => {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(source)) {
            if (value === null || value === undefined) continue;
            if (key === 'exciseLabels' && Array.isArray(value) && value.length === 0) continue;
            result[key] = value;
        }
        return result;
    };

    const normalized = clean(request);
    if (Array.isArray(normalized.products)) {
        normalized.products = normalized.products.map((product) => (isPlainObject(product) ? clean(product) : product));
    }
    return normalized;
}
