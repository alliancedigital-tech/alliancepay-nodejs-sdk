import { describe, it, expect } from 'vitest';
import { buildFiscalProducts } from './fiscal-products-builder';
import { ValidationException } from '../../core/exceptions/validation.exception';
import { FiscalizationRequestSchema } from './dto/fiscalization-request.dto';

const sumKop = (products: { count: number; unitPrice: number }[]) =>
    products.reduce((s, p) => s + Math.round(Math.round(p.count * 1000) * Math.round(p.unitPrice * 100) / 1000), 0);

const line = (id: string, count: number, unitPrice: number) => ({ id, name: `Item ${id}`, count, unitPrice, measurementCode: '0001' });

describe('buildFiscalProducts', () => {
    it('returns lines unchanged without discount', () => {
        const r = buildFiscalProducts([line('1', 2, 120), line('2', 1, 50.5)]);
        expect(r.map((p) => [p.id, p.count, p.unitPrice])).toEqual([['1', 2, 120], ['2', 1, 50.5]]);
        expect(sumKop(r)).toBe(29050);
    });

    it('distributes a cart discount and keeps the exact total', () => {
        const r = buildFiscalProducts([line('1', 2, 100), line('2', 1, 50), line('3', 3, 10)], { expectedTotal: 250 });
        expect(sumKop(r)).toBe(25000);
    });

    it('puts the rounding remainder on the last line', () => {
        const r = buildFiscalProducts([line('1', 1, 10), line('2', 1, 10), line('3', 1, 10)], { expectedTotal: 20 });
        expect(sumKop(r)).toBe(2000);
        expect(r).toHaveLength(3);
    });

    it('splits the last line when the remainder is not expressible via unitPrice (count > 1)', () => {
        const r = buildFiscalProducts([line('1', 3, 10)], { expectedTotal: 29.99 });
        expect(sumKop(r)).toBe(2999);
        expect(r).toHaveLength(2);
        expect(r[1]).toMatchObject({ id: '1', count: 1 });
    });

    it('treats paid delivery as a normal service line', () => {
        const r = buildFiscalProducts([line('1', 1, 100), { id: 'delivery', name: 'Delivery', count: 1, unitPrice: 50, measurementCode: '0001' }], { expectedTotal: 140 });
        expect(sumKop(r)).toBe(14000);
    });

    it('supports fractional counts', () => {
        const r = buildFiscalProducts([line('1', 0.5, 99.99)], { expectedTotal: 49.99 });
        expect(sumKop(r)).toBe(4999);
    });

    it('carries fiscal fields to every produced position', () => {
        const r = buildFiscalProducts(
            [{ ...line('1', 3, 10), taxCode: 2, classificationCode: '2203000000', exciseLabels: ['A1'] }],
            { expectedTotal: 29.99 }
        );
        for (const p of r) {
            expect(p).toMatchObject({ taxCode: 2, classificationCode: '2203000000', exciseLabels: ['A1'] });
        }
    });

    it('produces products accepted by the request schema', () => {
        const products = buildFiscalProducts([line('1', 3, 10), line('2', 2, 7.77)], { expectedTotal: 40.01 });
        const parsed = FiscalizationRequestSchema.safeParse({
            merchantRequestId: 'r', merchantId: 'm', operationId: 'op', notificationUrl: 'https://m.test/cb', products,
        });
        expect(parsed.success).toBe(true);
    });

    it('throws on empty lines, invalid totals and non-positive values', () => {
        expect(() => buildFiscalProducts([])).toThrow(ValidationException);
        expect(() => buildFiscalProducts([line('1', 1, 10)], { expectedTotal: 11 })).toThrow(ValidationException);
        expect(() => buildFiscalProducts([line('1', 1, 10)], { expectedTotal: 0 })).toThrow(ValidationException);
        expect(() => buildFiscalProducts([line('1', 0, 10)])).toThrow(ValidationException);
    });

    it('keeps sum exact over many random carts', () => {
        let seed = 42;
        const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
        for (let i = 0; i < 300; i++) {
            const lines = Array.from({ length: 1 + Math.floor(rnd() * 5) }, (_, k) =>
                line(String(k), Math.round((0.001 + rnd() * 5) * 1000) / 1000, Math.round((1 + rnd() * 500) * 100) / 100));
            const subtotal = sumKop(lines);
            const expected = Math.max(1, Math.floor(subtotal * (0.5 + rnd() * 0.5)));
            try {
                const r = buildFiscalProducts(lines, { expectedTotal: expected / 100 });
                expect(sumKop(r)).toBe(expected);
            } catch (e) {
                expect(e).toBeInstanceOf(ValidationException);
            }
        }
    });
});
