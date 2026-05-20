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
            expect(e.errors[0]).toContain('operation.type');
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
});
