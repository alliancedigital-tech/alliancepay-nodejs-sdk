import { describe, it, expect } from 'vitest';
import { DtoValidator } from '../../../core/validator/dto-validator';
import { CallbackSchema } from './callback.dto';
import {ValidationException} from '../../../core/exceptions/validation.exception';

describe('CallbackSchema Validation', () => {
    const validCallback = {
        ecomOrderId: "ORD-99",
        coinAmount: 5000,
        merchantId: "M-1",
        statusUrl: "https://site.com/status",
        redirectUrl: "https://site.com/ok",
        notificationUrl: "https://site.com/hook",
        notificationEncryption: false,
        hppOrderId: "HPP-123",
        merchantRequestId: "REQ-001",
        paymentMethods: ["CARD"],
        orderStatus: "SUCCESS",
        operation: {
            type: "PURCHASE",
            rrn: "123456789",
            coinAmount: 5000,
            merchantId: "M-1",
            operationId: "OP-1",
            ecomOperationId: "ECOM-1",
            status: "SUCCESS",
            transactionCurrency: "UAH",
            transactionResponseInfo: {
                "actionCode": "1",
                "responseCode": "01",
                "description": "authorisationDeniedCardExpired"
            },
            hppOrderId: "HPP-123"
        }
    };

    it('should pass with a full valid bank callback', () => {
        expect(() => DtoValidator.validate(validCallback, CallbackSchema)).not.toThrow(ValidationException);
    });

    it('should pass successfully if optional fields like RRN are missing', () => {
        const validCallbackWithoutRrn = JSON.parse(JSON.stringify(validCallback));
        delete validCallbackWithoutRrn.operation.rrn;

        expect(() => DtoValidator.validate(validCallbackWithoutRrn, CallbackSchema)).not.toThrow();
    });

    it('should fail if any operation in the array is missing a required field (e.g., type)', () => {
        const invalidData = JSON.parse(JSON.stringify(validCallback));
        delete invalidData.operation.type;

        try {
            DtoValidator.validate(invalidData, CallbackSchema);
            expect.fail('Validator should have thrown ValidationException');
        } catch (e: any) {
            if (e.name === 'AssertionError') throw e;

            expect(e).toBeInstanceOf(ValidationException);
            expect(e.errors[0]).toContain('for field operation.type');
        }
    });

    it('should throw error if critical fields like status are missing', () => {
        const invalidData = JSON.parse(JSON.stringify(validCallback));
        delete invalidData.operation.status;

        expect(() => DtoValidator.validate(invalidData, CallbackSchema)).toThrow(ValidationException);
    });

    it('should fail if paymentMethods is not an array', () => {
        const invalidData = { ...validCallback, paymentMethods: "CARD" };
        expect(() => DtoValidator.validate(invalidData, CallbackSchema)).toThrow(/received string for field paymentMethods/);
    });

    it('should pass with operation.type = PREAUTH', () => {
        const preauthCallback = {
            ...validCallback,
            operation: {
                ...validCallback.operation,
                type: 'PREAUTH',
            },
        };
        expect(() => DtoValidator.validate(preauthCallback, CallbackSchema)).not.toThrow(ValidationException);
    });

    it('should pass with operation.type = COMPLETION and preauth fields', () => {
        const completionCallback = {
            ...validCallback,
            operation: {
                ...validCallback.operation,
                type: 'COMPLETION',
                rrnPreauth: '621610670831',
                preauthOperationId: '1785840105543ovr-HqqpbrZ',
                preauthCoinAmount: 5000,
                preauthEcomOperationId: '78093fa9-6c65-489f-8907-2aff145a37a9',
            },
        };
        expect(() => DtoValidator.validate(completionCallback, CallbackSchema)).not.toThrow(ValidationException);
    });

    it('should pass with operation.type = COMPLETION without preauth fields (all optional)', () => {
        const completionCallback = {
            ...validCallback,
            operation: {
                ...validCallback.operation,
                type: 'COMPLETION',
            },
        };
        expect(() => DtoValidator.validate(completionCallback, CallbackSchema)).not.toThrow(ValidationException);
    });

    it('should pass with operation.type = COMPLETION and null preauth fields (узгодженість з CompletionResponseSchema)', () => {
        const completionCallback = {
            ...validCallback,
            operation: {
                ...validCallback.operation,
                type: 'COMPLETION',
                rrnPreauth: null,
                preauthOperationId: null,
                preauthCoinAmount: null,
                preauthEcomOperationId: null,
            },
        };
        expect(() => DtoValidator.validate(completionCallback, CallbackSchema)).not.toThrow(ValidationException);
    });

    it('should fail with operation.type = COMPLETION and preauthCoinAmount as float', () => {
        const invalidCallback = {
            ...validCallback,
            operation: {
                ...validCallback.operation,
                type: 'COMPLETION',
                preauthCoinAmount: 100.5,
            },
        };
        expect(() => DtoValidator.validate(invalidCallback, CallbackSchema)).toThrow(ValidationException);
    });

    it('should fail with unknown operation type', () => {
        const invalidCallback = {
            ...validCallback,
            operation: {
                ...validCallback.operation,
                type: 'UNKNOWN_TYPE',
            },
        };
        expect(() => DtoValidator.validate(invalidCallback, CallbackSchema)).toThrow(ValidationException);
    });

    it('should pass with notificationEncryption absent (optional)', () => {
        const callbackWithoutEncryption = JSON.parse(JSON.stringify(validCallback));
        delete callbackWithoutEncryption.notificationEncryption;
        expect(() => DtoValidator.validate(callbackWithoutEncryption, CallbackSchema)).not.toThrow();
    });

    it('should coerce operation.sourceCurrencyCode/conversionRate given as numeric strings (real bank callback format)', () => {
        const callbackWithStringConversionFields = {
            ...validCallback,
            operation: {
                ...validCallback.operation,
                sourceAmount: '1000',
                sourceCurrencyCode: '840',
                conversionRate: '44.00',
            },
        };

        const result = CallbackSchema.parse(callbackWithStringConversionFields);

        expect(result.operation.sourceAmount).toBe(1000);
        expect(result.operation.sourceCurrencyCode).toBe(840);
        expect(result.operation.conversionRate).toBe(44);
    });
});
