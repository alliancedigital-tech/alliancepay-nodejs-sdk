import { ValidationException } from '../../core/exceptions/validation.exception';
import { ResolvedFiscalFields } from './fiscal-product-resolver';
import { FiscalProductDto } from './dto/fiscalization-request.dto';

export interface FiscalLineInput extends Partial<ResolvedFiscalFields> {
    id: string | number;
    name: string;
    /** Up to 3 decimals. */
    count: number;
    /** UAH (hryvnias) per unit, before the cart-level discount. */
    unitPrice: number;
    measurementCode: string;
}

export interface BuildFiscalProductsOptions {
    /** Amount actually paid (or refunded), UAH. Defaults to the sum of the lines (no cart discount). */
    expectedTotal?: number;
}

const toKopiykas = (uah: number): number => Math.round(uah * 100);
const toMilli = (count: number): number => Math.round(count * 1000);
const lineKopiykas = (countMilli: number, unitKopiykas: number): number => Math.round((countMilli * unitKopiykas) / 1000);

/**
 * Distributes the cart discount over the lines and guarantees sum(count x unitPrice) === expectedTotal.
 * All math is done in integer kopiykas. The rounding remainder is put on the LAST line; when it cannot be
 * expressed through that line's unit price, the line is split into the main part plus one extra piece (count 1)
 * carrying the remainder, so the total is always exact. Paid delivery is just another line (count 1).
 */
export function buildFiscalProducts(lines: FiscalLineInput[], options: BuildFiscalProductsOptions = {}): FiscalProductDto[] {
    if (!Array.isArray(lines) || lines.length === 0) {
        throw new ValidationException(['products must not be empty.']);
    }

    const prepared = lines.map((line) => {
        const countMilli = toMilli(line.count);
        const unit = toKopiykas(line.unitPrice);
        if (countMilli <= 0 || unit <= 0) {
            throw new ValidationException([`Line "${line.name}": count and unitPrice must be positive.`]);
        }
        return { line, countMilli, unit, total: lineKopiykas(countMilli, unit) };
    });

    const subtotal = prepared.reduce((sum, item) => sum + item.total, 0);
    const expected = options.expectedTotal === undefined ? subtotal : toKopiykas(options.expectedTotal);

    if (expected <= 0 || expected > subtotal) {
        throw new ValidationException([`expectedTotal (${expected / 100}) must be positive and not exceed the sum of lines (${subtotal / 100}).`]);
    }

    const discount = subtotal - expected;
    const result: FiscalProductDto[] = [];
    let allocated = 0;

    prepared.forEach((item, index) => {
        const isLast = index === prepared.length - 1;
        const share = isLast ? 0 : Math.floor((discount * item.total) / subtotal);
        const target = isLast ? expected - allocated : item.total - share;

        if (target <= 0) {
            throw new ValidationException([`Line "${item.line.name}": discounted amount must be positive.`]);
        }

        // Keep the original unit price when it already produces the target, otherwise derive it.
        let unit = lineKopiykas(item.countMilli, item.unit) === target
            ? item.unit
            : (isLast ? Math.floor((target * 1000) / item.countMilli) : Math.round((target * 1000) / item.countMilli));

        if (unit <= 0) {
            throw new ValidationException([`Line "${item.line.name}": discounted amount is too small for its quantity.`]);
        }

        const actual = lineKopiykas(item.countMilli, unit);
        allocated += actual;
        result.push(toProduct(item.line, item.countMilli, unit));

        const remainder = isLast ? target - actual : 0;
        if (remainder > 0) {
            allocated += remainder;
            result.push(toProduct(item.line, 1000, remainder));
        }
    });

    return result;
}

function toProduct(line: FiscalLineInput, countMilli: number, unitKopiykas: number): FiscalProductDto {
    const product: FiscalProductDto = {
        id: String(line.id),
        name: line.name,
        count: countMilli / 1000,
        measurementCode: line.measurementCode,
        unitPrice: unitKopiykas / 100,
    };
    if (line.taxCode !== undefined) product.taxCode = line.taxCode;
    if (line.classificationCode !== undefined) product.classificationCode = line.classificationCode;
    if (line.exciseLabels !== undefined && line.exciseLabels.length > 0) product.exciseLabels = line.exciseLabels;
    return product;
}
