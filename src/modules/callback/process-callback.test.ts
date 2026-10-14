import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CallbackHandler } from './process-callback';
import { DtoValidator } from '../../core/validator/dto-validator';
import { ValidationException } from '../../core/exceptions/validation.exception';
import { OPERATION_TYPES } from '../../core/constants/api';
import { JwsVerifier } from '../../core/jws/jws-verifier';

vi.mock('../../core/jws/jws-verifier');

describe('CallbackHandler', () => {
    let handler: CallbackHandler;
    const options = { baseUrl: 'https://api.test.com' };

    const validOperation = {
        type: OPERATION_TYPES.PURCHASE,
        rrn: '123456789012',
        coinAmount: 1000,
        merchantId: 'm-123',
        operationId: 'op-456',
        ecomOperationId: 'ecom-789',
        status: 'success',
        transactionCurrency: 'UAH',
        transactionResponseInfo: {},
        hppOrderId: 'hpp-123'
    };

    const validCallbackData = {
        ecomOrderId: 'ecom-123',
        coinAmount: 1000,
        merchantId: 'm-123',
        statusUrl: 'https://test.com/status',
        redirectUrl: 'https://test.com/redirect',
        notificationUrl: 'https://test.com/notify',
        notificationEncryption: true,
        hppOrderId: 'hpp-123',
        merchantRequestId: 'req-456',
        paymentMethods: ['card'],
        orderStatus: 'paid',
        operation: validOperation
    };

    beforeEach(() => {
        handler = new CallbackHandler();
        vi.clearAllMocks();
    });

    it('should return callback data when input is a parsed object', async () => {
        const validateSpy = vi.spyOn(DtoValidator, 'validate');

        const result = await handler.handle(validCallbackData, options);

        expect(result).toEqual(validCallbackData);
        expect(validateSpy).toHaveBeenCalledWith(validCallbackData, expect.any(Object));
    });

    it('should parse a plain JSON string body', async () => {
        const result = await handler.handle(JSON.stringify(validCallbackData), options);

        expect(result).toEqual(validCallbackData);
    });

    it('should verify a compact JWS string body via JwsVerifier', async () => {
        vi.mocked(JwsVerifier.verify).mockResolvedValue(validCallbackData as any);

        const jwsToken = 'header.payload.signature';
        const result = await handler.handle(jwsToken, options);

        expect(JwsVerifier.verify).toHaveBeenCalledWith(jwsToken, { baseUrl: options.baseUrl, apiVersion: expect.any(String) });
        expect(result).toEqual(validCallbackData);
    });

    it('should throw ValidationException for a string that is neither JSON nor a JWS token', async () => {
        await expect(handler.handle('not json and not jws', options)).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException for a non-object, non-string body', async () => {
        await expect(handler.handle(42, options)).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException if DtoValidator fails', async () => {
        const invalidData = { ...validCallbackData, ecomOrderId: '' };

        await expect(handler.handle(invalidData, options)).rejects.toThrow(ValidationException);
    });

    it('should throw ValidationException if operation type is unknown', async () => {
        const dataWithInvalidType = {
            ...validCallbackData,
            operation: {
                ...validOperation,
                type: 'UNKNOWN_TYPE' as any
            }
        };

        await expect(handler.handle(dataWithInvalidType, options)).rejects.toThrow(ValidationException);
        await expect(handler.handle(dataWithInvalidType, options)).rejects.toThrow(/operation.type/);
    });

    it('should throw ValidationException if operation type is missing', async () => {
        const dataWithNoType = {
            ...validCallbackData,
            operation: {
                ...validOperation,
                type: undefined as any
            }
        };

        await expect(handler.handle(dataWithNoType, options)).rejects.toThrow(ValidationException);
        await expect(handler.handle(dataWithNoType, options)).rejects.toThrow(/operation.type/);
    });

    it.each([
        [OPERATION_TYPES.PURCHASE],
        [OPERATION_TYPES.REFUND],
        [OPERATION_TYPES.A2A]
    ])('should accept valid operation type: %s', async (type) => {
        const data = {
            ...validCallbackData,
            operation: { ...validOperation, type }
        };

        const result = await handler.handle(data, options);
        expect(result.operation.type).toBe(type);
    });

    it('should return the validator-parsed operation, coercing numeric-string sourceCurrencyCode/conversionRate (real bank callback format)', async () => {
        const dataWithStringConversionFields = {
            ...validCallbackData,
            operation: {
                ...validOperation,
                sourceAmount: '1000',
                sourceCurrencyCode: '840',
                conversionRate: '44.00',
            },
        };

        const result: any = await handler.handle(dataWithStringConversionFields, options);

        expect(result.operation.sourceAmount).toBe(1000);
        expect(result.operation.sourceCurrencyCode).toBe(840);
        expect(result.operation.conversionRate).toBe(44);
    });
});
