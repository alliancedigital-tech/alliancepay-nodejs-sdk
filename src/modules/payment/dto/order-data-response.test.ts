import { describe, it, expect } from 'vitest';
import { DtoValidator } from '../../../core/validator/dto-validator';
import { OrderDataResponseSchema } from './order-data-response';
import { ValidationException } from '../../../core/exceptions/validation.exception';

describe('OrderDataResponseSchema Validation', () => {
    const createValidOperation = (type: 'PURCHASE' | 'REFUND', rrn: string) => ({
        type: type,
        rrn: rrn,
        coinAmount: 1000,
        merchantId: "M-1",
        operationId: "OP-1",
        ecomOperationId: "ECOM-1",
        status: "SUCCESS",
        transactionCurrency: "UAH",
        transactionResponseInfo: { authCode: "123456" },
        hppOrderId: "HPP-100"
    });

    const validOrderResponse = {
        coinAmount: 2000,
        ecomOrderId: "ORDER-ID-001",
        merchantId: "MERCH-ID-99",
        hppOrderId: "HPP-ID-55",
        hppPayType: "CARD",
        merchantRequestId: "REQ-XYZ",
        orderStatus: "PARTIAL_REFUNDED",
        paymentMethods: ["card", "googlepay"],
        operations: [
            createValidOperation('PURCHASE', 'RRN-001'),
            createValidOperation('REFUND', 'RRN-002')
        ]
    };

    it('should validate successfully with a list of multiple operations', () => {
        expect(() => DtoValidator.validate(validOrderResponse, OrderDataResponseSchema)).not.toThrow();
    });

    it('should fail if the operations field is not an array', () => {
        const invalidData = {
            ...validOrderResponse,
            operations: {}
        };

        expect(() => DtoValidator.validate(invalidData, OrderDataResponseSchema))
            .toThrow(ValidationException);
    });

    it('should fail if any operation in the array is missing a required field (e.g., rrn)', () => {
        const invalidData = JSON.parse(JSON.stringify(validOrderResponse));
        delete invalidData.operations[1].rrn;

        try {
            DtoValidator.validate(invalidData, OrderDataResponseSchema);
            expect.toThrow(ValidationException);
        } catch (e: any) {
            expect(e).toBeInstanceOf(ValidationException);
            expect(e.errors[0]).toContain('Invalid input: expected string, received undefined for field operations.1.rrn');
        }
    });

    it('should pass even if optional fields like statusUrl or redirectUrl are null', () => {
        const dataWithNulls = {
            ...validOrderResponse,
            statusUrl: null,
            redirectUrl: null,
            notificationUrl: null
        };

        expect(() => DtoValidator.validate(dataWithNulls, OrderDataResponseSchema)).not.toThrow();
    });

    it('should fail if paymentMethods array is empty but required', () => {
        const invalidData = {
            ...validOrderResponse,
            paymentMethods: []
        };

        expect(() => DtoValidator.validate(invalidData, OrderDataResponseSchema)).toThrow();
    });
});
