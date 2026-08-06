import { describe, it, expect } from 'vitest';
import { DtoValidator } from '../../../core/validator/dto-validator';
import { CompletionResponseSchema } from './completion-response.dto';

describe('CompletionResponseSchema Validation', () => {
    const validResponse = {
        type: 'COMPLETION',
        coinAmount: 25000,
        merchantId: 'ab6c9936-2946-4f12-9202-712930bccd19',
        ecomOperationId: 'da0513cc-3332-40db-ad97-861bc0d330a4',
        status: 'SUCCESS',
        transactionCurrency: '980',
        transactionResponseInfo: {
            actionCode: '0',
            responseCode: '00',
            description: 'approved',
        },
        hppOrderId: '1785840083139JBGQkp6bfqU',
    };

    it('should validate a minimal valid completion response', () => {
        expect(() => DtoValidator.validate(validResponse, CompletionResponseSchema)).not.toThrow();
    });

    it('should accept response with all preauth-specific fields', () => {
        const withPreauth = {
            ...validResponse,
            rrnPreauth: '621610670831',
            preauthOperationId: '1785840105543ovr-HqqpbrZ',
            preauthCoinAmount: 25000,
            preauthEcomOperationId: '78093fa9-6c65-489f-8907-2aff145a37a9',
        };
        expect(() => DtoValidator.validate(withPreauth, CompletionResponseSchema)).not.toThrow();
    });

    it('should accept rrn = null (nullable)', () => {
        const valid = { ...validResponse, rrn: null };
        expect(() => DtoValidator.validate(valid, CompletionResponseSchema)).not.toThrow();
    });

    it('should accept preauthCoinAmount = null (nullable)', () => {
        const valid = { ...validResponse, preauthCoinAmount: null };
        expect(() => DtoValidator.validate(valid, CompletionResponseSchema)).not.toThrow();
    });

    it('should accept preauthOperationId = null (nullable)', () => {
        const valid = { ...validResponse, preauthOperationId: null };
        expect(() => DtoValidator.validate(valid, CompletionResponseSchema)).not.toThrow();
    });

    it('should accept merchantRequestId = null (nullable)', () => {
        const valid = { ...validResponse, merchantRequestId: null };
        expect(() => DtoValidator.validate(valid, CompletionResponseSchema)).not.toThrow();
    });

    it('should accept optional fields absent', () => {
        // Всі optional поля відсутні — лише required
        expect(() => DtoValidator.validate(validResponse, CompletionResponseSchema)).not.toThrow();
    });

    it('should throw if coinAmount is a float (not int)', () => {
        const invalid = { ...validResponse, coinAmount: 250.50 };
        expect(() => DtoValidator.validate(invalid, CompletionResponseSchema)).toThrow(
            'Invalid input: expected int, received number for field coinAmount'
        );
    });

    it('should throw if preauthCoinAmount is a float (not int)', () => {
        const invalid = { ...validResponse, preauthCoinAmount: 250.50 };
        expect(() => DtoValidator.validate(invalid, CompletionResponseSchema)).toThrow(
            'Invalid input: expected int, received number for field preauthCoinAmount'
        );
    });

    it('should throw if ecomOperationId is missing', () => {
        const { ecomOperationId, ...invalid } = validResponse;
        expect(() => DtoValidator.validate(invalid, CompletionResponseSchema)).toThrow();
    });

    it('should throw if hppOrderId is missing', () => {
        const { hppOrderId, ...invalid } = validResponse;
        expect(() => DtoValidator.validate(invalid, CompletionResponseSchema)).toThrow();
    });

    it('should throw if status is missing', () => {
        const { status, ...invalid } = validResponse;
        expect(() => DtoValidator.validate(invalid, CompletionResponseSchema)).toThrow();
    });

    it('should throw if transactionCurrency is missing', () => {
        const { transactionCurrency, ...invalid } = validResponse;
        expect(() => DtoValidator.validate(invalid, CompletionResponseSchema)).toThrow();
    });

    it('should accept creationDateTime as string', () => {
        const valid = { ...validResponse, creationDateTime: '2026.08.04 13:42:31.339' };
        expect(() => DtoValidator.validate(valid, CompletionResponseSchema)).not.toThrow();
    });

    it('should accept creationDateTime as Date instance', () => {
        const valid = { ...validResponse, creationDateTime: new Date() };
        expect(() => DtoValidator.validate(valid, CompletionResponseSchema)).not.toThrow();
    });
});
