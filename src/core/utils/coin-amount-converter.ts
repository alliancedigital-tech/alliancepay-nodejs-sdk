import {ValidationException} from '../exceptions/validation.exception';

export class CoinAmountConverter {
    public static convertToUahCoins(amount: number, conversionRate: number): number {
        return Math.round(amount * conversionRate * 100);
    }

    public static resolveCoinAmount(
        coinAmount: number | undefined,
        sourceAmount: number | undefined,
        conversionRate: number | undefined
    ): number | undefined {
        if ((sourceAmount !== undefined) !== (conversionRate !== undefined)) {
            throw new ValidationException([
                'sourceAmount and conversionRate must be provided together'
            ]);
        }

        return (sourceAmount !== undefined && conversionRate !== undefined)
            ? CoinAmountConverter.convertToUahCoins(sourceAmount, conversionRate)
            : coinAmount;
    }
}
