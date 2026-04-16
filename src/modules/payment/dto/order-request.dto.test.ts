import { describe, it, expect } from 'vitest';
import { DtoValidator } from '../../../core/validator/dto-validator';
import { OrderRequestSchema } from './order-request.dto';

describe('OrderRequestSchema Validation', () => {
    const validRequest = {
        merchantRequestId: 'REQ-1',
        merchantId: "M-1",
        hppPayType: "HPP",
        coinAmount: 100,
        paymentMethods: ["card"],
        successUrl: "https://ok.com",
        failUrl: "https://fail.com",
        statusPageType: "REDIRECT",
        customerData: {
            senderCustomerId: "CUST-001"
        }
    };

    it('should validate correct order creation request', () => {
        expect(() => DtoValidator.validate(validRequest, OrderRequestSchema)).not.toThrow();
    });

    it('should throw error if nested customerData.senderCustomerId is empty', () => {
        const invalid = { ...validRequest, customerData: {senderCustomerId: ""} };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Too small: expected string to have >=1 characters for field customerData.senderCustomerId'
        );
    });

    it('should throw error if nested customerData.senderCustomerId is missing', () => {
        const invalid = { ...validRequest, customerData: {} };
        expect(() => DtoValidator.validate(invalid, OrderRequestSchema)).toThrow(
            'Validation failed: Invalid input: expected string, received undefined for field customerData.senderCustomerId'
        );
    });

    it('should accept optional fields like merchantComment', () => {
        const withComment = { ...validRequest, merchantComment: "Testing payment" };
        expect(() => DtoValidator.validate(withComment, OrderRequestSchema)).not.toThrow();
    });
});
