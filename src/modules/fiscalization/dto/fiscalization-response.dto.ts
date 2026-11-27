import { z } from 'zod';

const optionalText = z.string().nullable().optional();

const fiscalizationFields = {
    merchantRequestId: z.string().optional(),
    merchantId: z.string().optional(),
    operationType: optionalText,
    bucketId: optionalText,
    receiptComment: optionalText,
    products: z.array(z.looseObject({})).nullable().optional(),
    fiscalNumber: optionalText,
    receiptUrl: optionalText,
    fiscalizationDateTime: optionalText,
    fiscalizationModificationDateTime: optionalText,
    errorCode: z.union([z.string(), z.number()]).nullable().optional(),
    errorDescription: optionalText,
    creationDateTime: optionalText,
    modificationDateTime: optionalText,
};

/** `status` is kept as a plain string: an unknown value from the bank must not break parsing. */
export const FiscalizationResponseSchema = z.looseObject({
    ...fiscalizationFields,
    operationId: z.string().trim().min(1),
    status: z.string().trim().min(1),
});

/** Callback has the same shape, but every field may be absent; a record is located by operationId or merchantRequestId. */
export const FiscalizationCallbackSchema = z.looseObject({
    ...fiscalizationFields,
    operationId: z.string().trim().min(1).optional(),
    status: z.string().optional(),
}).refine(
    (data) => !!data.operationId || !!data.merchantRequestId,
    { message: 'operationId or merchantRequestId is required', path: ['operationId'] }
);

export type FiscalizationResponseDto = z.infer<typeof FiscalizationResponseSchema>;
export type FiscalizationCallbackData = z.infer<typeof FiscalizationCallbackSchema>;

export class FiscalizationCallbackDTO {
    constructor(
        public readonly data: FiscalizationCallbackData,
        private readonly rawPayload: Record<string, unknown>
    ) {}

    /** Distinguishes "field absent in this delivery" from "field present and null". */
    public has(field: string): boolean {
        return Object.prototype.hasOwnProperty.call(this.rawPayload, field);
    }

    public getRawPayload(): Record<string, unknown> {
        return this.rawPayload;
    }
}
