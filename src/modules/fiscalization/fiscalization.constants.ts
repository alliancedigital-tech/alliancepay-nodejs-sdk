/** Default unit of measure: "piece". */
export const FISCAL_DEFAULT_MEASUREMENT_CODE = '0001';

/** For these tax codes `classificationCode` (UKTZED) is mandatory. */
export const FISCAL_CLASSIFICATION_REQUIRED_TAX_CODES: readonly number[] = [2, 7, 8];

/** The API does not document length limits; 255 is the agreed assumption. */
export const FISCAL_MAX_STRING_LENGTH = 255;

export const FISCALIZATION_STATUS = {
    PENDING: 'PENDING',
    SUCCESS: 'SUCCESS',
    FAIL: 'FAIL',
} as const;

export type FiscalizationStatus = typeof FISCALIZATION_STATUS[keyof typeof FISCALIZATION_STATUS];

export const FISCALIZATION_OPERATION_TYPE = {
    PURCHASE: 'PURCHASE',
    REFUND: 'REFUND',
} as const;

/** Business `msgCode` values of HTTP 400 replies (FiscalizationException.code). */
export const FISCALIZATION_ERROR_CODES = {
    MISSING_REQUIRED_FIELD: 'missing_required_field',
    INVALID_FORMAT: 'invalid_format',
    PAYMENT_NOT_FOUND: 'payment_not_found',
    ORIGINAL_RECEIPT_NOT_FOUND: 'original_receipt_not_found',
} as const;
