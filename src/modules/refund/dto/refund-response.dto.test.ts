import { describe, it, expect } from 'vitest';
import { DtoValidator } from '../../../core/validator/dto-validator';
import { RefundResponseSchema } from './refund-response.dto';
import {ValidationException} from '../../../core/exceptions/validation.exception';

describe('RefundResponseDto Validation', () => {
    const validRefundData = {
        type: "REFUND",
        rrn: "123456789012",
        coinAmount: 1500,
        merchantId: "M-100",
        operationId: "OP-REF-1",
        ecomOperationId: "ECOM-REF-1",
        status: "SUCCESS",
        merchantRequestId: "M-REQ-777",
        transactionCurrency: "UAH",
        creationDateTime: "2026-03-20 10:00:00.00+00:00",
        modificationDateTime: "2026-03-20 10:05:00.00+00:00",
        transactionResponseInfo: { authCode: "998877" },
        productType: "ECOM",
        hppOrderId: "HPP-999",
        notificationUrl: "https://webhook.site/test"
    };

    it('should validate a complete successful refund response', () => {
        expect(() => DtoValidator.validate(validRefundData, RefundResponseSchema)).not.toThrow();
    });

    it('should throw error if critical bank fields like rrn or operationId are missing', () => {
        const invalidData = { ...validRefundData };
        // @ts-ignore
        delete invalidData.rrn;
        // @ts-ignore
        delete invalidData.operationId;

        expect(() => DtoValidator.validate(invalidData, RefundResponseSchema)).toThrow();
    });

    it('should allow optional fields like notificationEncryption to be present', () => {
        const dataWithOptional = {
            ...validRefundData,
            notificationEncryption: true,
            transactionType: 2
        };
        expect(() => DtoValidator.validate(dataWithOptional, RefundResponseSchema)).not.toThrow();
    });

    it('should fail if transactionResponseInfo is not an object', () => {
        const invalidData = { ...validRefundData, transactionResponseInfo: "success" };
        expect(() => DtoValidator.validate(invalidData, RefundResponseSchema))
            .toThrow(ValidationException);
    });
});
