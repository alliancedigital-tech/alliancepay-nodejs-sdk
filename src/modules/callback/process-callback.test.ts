import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CallbackHandler } from './process-callback';
import { DtoValidator } from '../../core/validator/dto-validator';
import { ValidationException } from '../../core/exceptions/validation.exception';
import { OPERATION_TYPES } from '../../core/constants/api';

describe('CallbackHandler', () => {
    let handler: CallbackHandler;

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

    it('should return callback data when input is valid', () => {
        // Шпигуємо за валідатором, щоб переконатися, що він викликається
        const validateSpy = vi.spyOn(DtoValidator, 'validate');

        const result = handler.handle(validCallbackData);

        expect(result).toEqual(validCallbackData);
        expect(validateSpy).toHaveBeenCalledWith(validCallbackData, expect.any(Object));
    });

    it('should throw ValidationException if DtoValidator fails', () => {
        const invalidData = { ...validCallbackData, ecomOrderId: '' };

        expect(() => handler.handle(invalidData)).toThrow(ValidationException);
    });

    it('should throw ValidationException if operation type is unknown', () => {
        const dataWithInvalidType = {
            ...validCallbackData,
            operation: {
                ...validOperation,
                type: 'UNKNOWN_TYPE' as any
            }
        };

        expect(() => handler.handle(dataWithInvalidType)).toThrow(ValidationException);
        expect(() => handler.handle(dataWithInvalidType)).toThrow(/operation.type/);
    });

    it('should throw ValidationException if operation type is missing', () => {
        const dataWithNoType = {
            ...validCallbackData,
            operation: {
                ...validOperation,
                type: undefined as any
            }
        };

        expect(() => handler.handle(dataWithNoType)).toThrow(ValidationException);
        expect(() => handler.handle(dataWithNoType)).toThrow(/operation.type/);
    });

    it.each([
        [OPERATION_TYPES.PURCHASE],
        [OPERATION_TYPES.REFUND]
    ])('should accept valid operation type: %s', (type) => {
        const data = {
            ...validCallbackData,
            operation: { ...validOperation, type }
        };

        expect(() => handler.handle(data)).not.toThrow();
        const result = handler.handle(data);
        expect(result.operation.type).toBe(type);
    });
});
