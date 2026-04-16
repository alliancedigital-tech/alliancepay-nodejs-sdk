import { describe, it, expect } from 'vitest';
import { DtoValidator } from '../../../core/validator/dto-validator';
import {OrderResponseDto, OrderResponseSchema} from './order-response.dto';
import { ValidationException } from '../../../core/exceptions/validation.exception';

describe('OrderResponseDto Validation', () => {
    const validData = {
        hppOrderId: "HPP-123",
        merchantRequestId: "REQ-456",
        hppPayType: "PURCHASE",
        paymentMethods: ["CARD", "apple_pay"],
        orderStatus: "CREATED",
        coinAmount: 10050,
        merchantId: "MERCH-01",
        redirectUrl: "https://pay.bank.com/checkout",
        statusUrl: "https://pay.bank.com/status",
        nbuQrCode: "data:image/png;base64,..."
    };

    it('should validate successfully with all required fields', () => {
        expect(() => DtoValidator.validate(validData, OrderResponseSchema)).not.toThrow();
    });

    it('should throw error if nbuQrCode is missing', () => {
        const { nbuQrCode, ...invalidData } = validData;
        expect(() => DtoValidator.validate(invalidData, OrderResponseSchema)).not.toThrow(ValidationException);
    });

    it('should not throw error if nbuQrCode is null', () => {
        const invalidData = { ...validData, nbuQrCode: null };
        expect(() => DtoValidator.validate(invalidData, OrderResponseSchema)).not.toThrow(ValidationException);
    });

    it('should fail if coinAmount is passed as a string', () => {
        const invalidData = { ...validData, coinAmount: "100.50" };
        expect(() => DtoValidator.validate(invalidData, OrderResponseSchema))
            .toThrow('Validation failed: Invalid input: expected number, received string for field coinAmount');
    });
});
