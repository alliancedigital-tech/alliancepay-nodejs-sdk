import { describe, it, expect } from 'vitest';
import { CoinAmountConverter } from './coin-amount-converter';
import { ValidationException } from '../exceptions/validation.exception';

describe('CoinAmountConverter', () => {
    describe('convertToUahCoins', () => {
        it('should convert a USD amount to UAH kopecks', () => {
            expect(CoinAmountConverter.convertToUahCoins(10, 39.5)).toBe(39500);
        });

        it('should round to the nearest kopeck', () => {
            expect(CoinAmountConverter.convertToUahCoins(10.005, 39.5)).toBe(39520);
        });
    });

    describe('resolveCoinAmount', () => {
        it('should return coinAmount as-is when sourceAmount/conversionRate are absent', () => {
            expect(CoinAmountConverter.resolveCoinAmount(1000, undefined, undefined)).toBe(1000);
        });

        it('should convert sourceAmount+conversionRate, taking precedence over a stale coinAmount', () => {
            expect(CoinAmountConverter.resolveCoinAmount(1, 10, 39.5)).toBe(39500);
        });

        it('should throw when only sourceAmount is provided', () => {
            expect(() => CoinAmountConverter.resolveCoinAmount(1, 10, undefined)).toThrow(ValidationException);
        });

        it('should throw when only conversionRate is provided', () => {
            expect(() => CoinAmountConverter.resolveCoinAmount(1, undefined, 39.5)).toThrow(ValidationException);
        });
    });
});
