import { ValidationException } from '../../core/exceptions/validation.exception';
import {
    FISCAL_CLASSIFICATION_REQUIRED_TAX_CODES,
    FISCAL_DEFAULT_MEASUREMENT_CODE,
} from './fiscalization.constants';

/** Raw values as stored by the application (product attributes or module defaults). */
export interface FiscalAttrs {
    taxCode?: number | string | null;
    classificationCode?: string | number | null;
    exciseLabels?: string[] | string | null;
    measurementCode?: string | null;
}

export interface ResolvedFiscalFields {
    measurementCode: string;
    taxCode?: number;
    classificationCode?: string;
    exciseLabels?: string[];
}

/** "AATE1, AATE2\nAATE3" -> ['AATE1', 'AATE2', 'AATE3']: trimmed, empty items removed. */
export function parseExciseLabels(value: string | string[] | null | undefined): string[] {
    if (value === null || value === undefined) return [];
    const items = Array.isArray(value) ? value : value.split(/[,\n\r]+/);
    return items.map((item) => String(item).trim()).filter((item) => item !== '');
}

function isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return parseExciseLabels(value as string[]).length === 0;
    return false;
}

function pick<K extends keyof FiscalAttrs>(field: K, productAttrs: FiscalAttrs, defaults: FiscalAttrs): FiscalAttrs[K] | undefined {
    if (!isEmpty(productAttrs[field])) return productAttrs[field];
    if (!isEmpty(defaults[field])) return defaults[field];
    return undefined;
}

function normalizeTaxCode(value: number | string, label: string): number {
    const parsed = typeof value === 'number' ? value : Number(String(value).trim());
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new ValidationException([`${label}: taxCode must be a positive integer (0 is not valid), got "${value}".`]);
    }
    return parsed;
}

/**
 * Picks every field independently: product value -> module default -> omitted
 * (measurementCode falls back to "0001"). Used by both automatic and manual fiscalization.
 * Throws ValidationException for malformed values and for taxCode 2/7/8 without classificationCode.
 */
export function resolveFiscalProductFields(
    productAttrs: FiscalAttrs = {},
    defaults: FiscalAttrs = {},
    productLabel = 'product'
): ResolvedFiscalFields {
    const resolved: ResolvedFiscalFields = {
        measurementCode: String(pick('measurementCode', productAttrs, defaults) ?? FISCAL_DEFAULT_MEASUREMENT_CODE).trim(),
    };

    const taxCode = pick('taxCode', productAttrs, defaults);
    if (taxCode !== undefined && taxCode !== null) {
        resolved.taxCode = normalizeTaxCode(taxCode, productLabel);
    }

    const classificationCode = pick('classificationCode', productAttrs, defaults);
    if (classificationCode !== undefined && classificationCode !== null) {
        const code = String(classificationCode).trim();
        if (!/^\d+$/.test(code)) {
            throw new ValidationException([`${productLabel}: classificationCode must contain digits only, got "${code}".`]);
        }
        resolved.classificationCode = code;
    }

    const exciseLabels = parseExciseLabels(pick('exciseLabels', productAttrs, defaults));
    if (exciseLabels.length > 0) {
        resolved.exciseLabels = exciseLabels;
    }

    if (
        resolved.taxCode !== undefined
        && FISCAL_CLASSIFICATION_REQUIRED_TAX_CODES.includes(resolved.taxCode)
        && !resolved.classificationCode
    ) {
        throw new ValidationException([
            `${productLabel}: classificationCode is required when taxCode is ${FISCAL_CLASSIFICATION_REQUIRED_TAX_CODES.join(', ')}. `
            + 'Set it on the product or in the default fiscalization settings.',
        ]);
    }

    return resolved;
}
