import { describe, it, expect } from 'vitest';
import { DtoValidator } from '../../../core/validator/dto-validator';
import { CompletionRequestSchema } from './create-completion-request.dto';

describe('CompletionRequestSchema Validation', () => {
    const validRequest = {
        merchantRequestId: '6c8ea695-9dbd-484d-8b6b-2033f3a1bb23',
        merchantId: 'ab6c9936-2946-4f12-9202-712930bccd19',
        originalOperationId: '1734612061099XJ-BEtZIEwA',
        coinAmount: 25000,
        date: '2024-12-19 17:59:23.54+00:00',
    };

    it('should validate a correct completion request', () => {
        expect(() => DtoValidator.validate(validRequest, CompletionRequestSchema)).not.toThrow();
    });

    it('should accept optional notificationUrl when provided as valid URL', () => {
        const valid = { ...validRequest, notificationUrl: 'https://callback.example.com/hook' };
        expect(() => DtoValidator.validate(valid, CompletionRequestSchema)).not.toThrow();
    });

    it('should accept notificationUrl as empty string', () => {
        const valid = { ...validRequest, notificationUrl: '' };
        expect(() => DtoValidator.validate(valid, CompletionRequestSchema)).not.toThrow();
    });

    it('should accept when notificationUrl is absent (optional)', () => {
        const valid = { ...validRequest };
        expect(() => DtoValidator.validate(valid, CompletionRequestSchema)).not.toThrow();
    });

    it('should throw if notificationUrl is an invalid URL', () => {
        const invalid = { ...validRequest, notificationUrl: 'not-a-url' };
        expect(() => DtoValidator.validate(invalid, CompletionRequestSchema)).toThrow();
    });

    it('should throw if merchantRequestId is empty', () => {
        const invalid = { ...validRequest, merchantRequestId: '' };
        expect(() => DtoValidator.validate(invalid, CompletionRequestSchema)).toThrow();
    });

    it('should throw if merchantId is empty', () => {
        const invalid = { ...validRequest, merchantId: '' };
        expect(() => DtoValidator.validate(invalid, CompletionRequestSchema)).toThrow();
    });

    it('should throw if originalOperationId is empty', () => {
        const invalid = { ...validRequest, originalOperationId: '' };
        expect(() => DtoValidator.validate(invalid, CompletionRequestSchema)).toThrow();
    });

    it('should throw if date is empty', () => {
        const invalid = { ...validRequest, date: '' };
        expect(() => DtoValidator.validate(invalid, CompletionRequestSchema)).toThrow();
    });

    it('should throw if coinAmount is a float (not int)', () => {
        const invalid = { ...validRequest, coinAmount: 250.50 };
        expect(() => DtoValidator.validate(invalid, CompletionRequestSchema)).toThrow(
            'Invalid input: expected int, received number for field coinAmount'
        );
    });

    it('should throw if coinAmount is negative', () => {
        const invalid = { ...validRequest, coinAmount: -100 };
        expect(() => DtoValidator.validate(invalid, CompletionRequestSchema)).toThrow();
    });

    it('should throw if coinAmount is zero', () => {
        const invalid = { ...validRequest, coinAmount: 0 };
        expect(() => DtoValidator.validate(invalid, CompletionRequestSchema)).toThrow();
    });

    it('should throw if coinAmount is missing', () => {
        const { coinAmount, ...invalid } = validRequest;
        expect(() => DtoValidator.validate(invalid, CompletionRequestSchema)).toThrow();
    });

    it('should throw if coinAmount is a string', () => {
        const invalid = { ...validRequest, coinAmount: '25000' as any };
        expect(() => DtoValidator.validate(invalid, CompletionRequestSchema)).toThrow(
            'Invalid input: expected number, received string for field coinAmount'
        );
    });
});
