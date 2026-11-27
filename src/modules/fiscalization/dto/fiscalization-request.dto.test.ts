import { describe, it, expect } from 'vitest';
import { FiscalizationRequestSchema, normalizeFiscalizationRequest } from './fiscalization-request.dto';

const valid = () => ({
    merchantRequestId: '8d2d1234-5678-4e92-a975-672f42fca5e3',
    merchantId: '713e73d8-84ee-4873-98a3-7f67bf0ddd63',
    operationId: '1772887138149SIx5b1QV7AI',
    receiptComment: 'PAYMENT_FOR_ORDER_123',
    notificationUrl: 'https://merchant.example.com/fiscalization/callback',
    products: [{
        id: 'p1', name: 'Товар 1', count: 2, measurementCode: '0001', unitPrice: 120,
        taxCode: 2, classificationCode: '2203000000', exciseLabels: ['AATE123456'],
    }],
});

describe('FiscalizationRequestSchema', () => {
    it('accepts the documented example', () => {
        expect(FiscalizationRequestSchema.safeParse(valid()).success).toBe(true);
    });

    it('requires notificationUrl', () => {
        const { notificationUrl, ...rest } = valid();
        expect(FiscalizationRequestSchema.safeParse(rest).success).toBe(false);
    });

    it('rejects an empty products array', () => {
        expect(FiscalizationRequestSchema.safeParse({ ...valid(), products: [] }).success).toBe(false);
    });

    it.each([2, 7, 8])('requires classificationCode when taxCode is %i', (taxCode) => {
        const data = valid();
        data.products[0] = { ...data.products[0], taxCode, classificationCode: undefined as any };
        expect(FiscalizationRequestSchema.safeParse(data).success).toBe(false);
    });

    it('does not require classificationCode for other tax codes', () => {
        const data = valid();
        data.products[0] = { id: 'p', name: 'n', count: 1, measurementCode: '0001', unitPrice: 1, taxCode: 3 } as any;
        expect(FiscalizationRequestSchema.safeParse(data).success).toBe(true);
    });

    it('rejects taxCode 0, non-digit classificationCode and empty excise labels', () => {
        const p = valid().products[0];
        for (const bad of [{ taxCode: 0 }, { classificationCode: '22AB' }, { exciseLabels: [] }, { exciseLabels: [''] }]) {
            const data = { ...valid(), products: [{ ...p, ...bad }] };
            expect(FiscalizationRequestSchema.safeParse(data).success).toBe(false);
        }
    });

    it('enforces decimal precision: count 3, unitPrice 2', () => {
        const p = valid().products[0];
        expect(FiscalizationRequestSchema.safeParse({ ...valid(), products: [{ ...p, count: 1.2345 }] }).success).toBe(false);
        expect(FiscalizationRequestSchema.safeParse({ ...valid(), products: [{ ...p, unitPrice: 1.234 }] }).success).toBe(false);
        expect(FiscalizationRequestSchema.safeParse({ ...valid(), products: [{ ...p, count: 0.125, unitPrice: 0.07 }] }).success).toBe(true);
    });

    it('coerces numeric product id to string and enforces the 255 limit', () => {
        const p = valid().products[0];
        const ok = FiscalizationRequestSchema.parse({ ...valid(), products: [{ ...p, id: 15 }] });
        expect(ok.products[0].id).toBe('15');
        expect(FiscalizationRequestSchema.safeParse({ ...valid(), products: [{ ...p, name: 'x'.repeat(256) }] }).success).toBe(false);
    });
});

describe('normalizeFiscalizationRequest', () => {
    it('drops null/undefined fields and empty exciseLabels, keeps the rest', () => {
        const input = {
            ...valid(), receiptComment: null,
            products: [{ id: 'p', name: 'n', count: 1, measurementCode: '0001', unitPrice: 1, taxCode: null, classificationCode: null, exciseLabels: [] }],
        };
        const out = normalizeFiscalizationRequest(input) as any;
        expect(out).not.toHaveProperty('receiptComment');
        expect(out.products[0]).toEqual({ id: 'p', name: 'n', count: 1, measurementCode: '0001', unitPrice: 1 });
    });

    it('passes non-objects through untouched', () => {
        expect(normalizeFiscalizationRequest(null)).toBeNull();
    });
});
