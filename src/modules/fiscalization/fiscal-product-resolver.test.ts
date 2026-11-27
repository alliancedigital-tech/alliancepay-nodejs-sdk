import { describe, it, expect } from 'vitest';
import { resolveFiscalProductFields, parseExciseLabels } from './fiscal-product-resolver';
import { ValidationException } from '../../core/exceptions/validation.exception';
import { FISCAL_DEFAULT_MEASUREMENT_CODE } from './fiscalization.constants';

describe('resolveFiscalProductFields', () => {
    it('falls back to measurementCode "0001" when nothing is set', () => {
        expect(resolveFiscalProductFields({}, {})).toEqual({ measurementCode: FISCAL_DEFAULT_MEASUREMENT_CODE });
        expect(FISCAL_DEFAULT_MEASUREMENT_CODE).toBe('0001');
    });

    it('uses the product attribute when filled', () => {
        const r = resolveFiscalProductFields(
            { taxCode: 3, measurementCode: '0002' },
            { taxCode: 1, measurementCode: '0001' }
        );
        expect(r).toEqual({ taxCode: 3, measurementCode: '0002' });
    });

    it('uses defaults when the product attribute is empty', () => {
        const r = resolveFiscalProductFields(
            { taxCode: null, classificationCode: '  ', exciseLabels: [] },
            { taxCode: 1, classificationCode: '2203000000', exciseLabels: 'A1, A2' }
        );
        expect(r).toEqual({
            measurementCode: '0001', taxCode: 1, classificationCode: '2203000000', exciseLabels: ['A1', 'A2'],
        });
    });

    it('resolves every field independently (mixed case)', () => {
        const r = resolveFiscalProductFields(
            { taxCode: 2 },
            { taxCode: 5, classificationCode: '2203000000', measurementCode: '0005' }
        );
        expect(r).toEqual({ taxCode: 2, classificationCode: '2203000000', measurementCode: '0005' });
    });

    it('omits optional fields when neither product nor defaults have them', () => {
        const r = resolveFiscalProductFields({}, { measurementCode: '0001' });
        expect(r).not.toHaveProperty('taxCode');
        expect(r).not.toHaveProperty('classificationCode');
        expect(r).not.toHaveProperty('exciseLabels');
    });

    it.each([2, 7, 8])('requires classificationCode for taxCode %i', (taxCode) => {
        expect(() => resolveFiscalProductFields({ taxCode }, {})).toThrow(ValidationException);
        expect(resolveFiscalProductFields({ taxCode }, { classificationCode: '1234567890' }).classificationCode).toBe('1234567890');
    });

    it('does not require classificationCode for other tax codes', () => {
        expect(() => resolveFiscalProductFields({ taxCode: 3 }, {})).not.toThrow();
    });

    it('rejects taxCode 0 and non-integers', () => {
        expect(() => resolveFiscalProductFields({ taxCode: 0 }, {})).toThrow(ValidationException);
        expect(() => resolveFiscalProductFields({ taxCode: 1.5 }, {})).toThrow(ValidationException);
        expect(() => resolveFiscalProductFields({ taxCode: 'abc' }, {})).toThrow(ValidationException);
    });

    it('accepts numeric string taxCode', () => {
        expect(resolveFiscalProductFields({ taxCode: '3' }, {}).taxCode).toBe(3);
    });

    it('rejects non-digit classificationCode and names the product', () => {
        expect(() => resolveFiscalProductFields({ classificationCode: '22-03' }, {}, 'Beer')).toThrow(/Beer/);
    });
});

describe('parseExciseLabels', () => {
    it('splits by comma and newline, trims and drops empties', () => {
        expect(parseExciseLabels(' A1 ,, A2\nA3\r\n ')).toEqual(['A1', 'A2', 'A3']);
    });
    it('handles arrays, null and undefined', () => {
        expect(parseExciseLabels([' A ', ''])).toEqual(['A']);
        expect(parseExciseLabels(null)).toEqual([]);
        expect(parseExciseLabels(undefined)).toEqual([]);
    });
});
