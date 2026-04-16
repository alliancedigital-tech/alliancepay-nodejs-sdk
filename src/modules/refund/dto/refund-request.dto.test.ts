import { describe, it, expect } from 'vitest';
import { DtoValidator } from '../../../core/validator/dto-validator';
import { RefundRequestSchema } from './refund-request.dto';
import {ValidationException} from '../../../core/exceptions/validation.exception';

describe('RefundRequestSchema Validation', () => {
    it('should pass when date is provided as a string in correct format', () => {
        const validRefund = {
            merchantRequestId: "REF-1",
            merchantId: "M-1",
            operationId: "OP-123",
            coinAmount: 500,
            date: "2026-03-23 14:00:00.00+00:00"
        };
        expect(() => DtoValidator.validate(validRefund, RefundRequestSchema)).not.toThrow();
    });

    it('should fail if coinAmount is not a number', () => {
        const data: any = { coinAmount: "500" };
        expect(() => DtoValidator.validate(data, RefundRequestSchema)).toThrow();
    });
});
