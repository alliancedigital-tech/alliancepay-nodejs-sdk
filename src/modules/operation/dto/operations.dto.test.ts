import { describe, it, expect } from 'vitest';
import { DtoValidator } from '../../../core/validator/dto-validator';
import {
    OperationPreAuthSchema,
    OperationCompletionSchema,
    OperationSchemaUnion,
} from './operations.dto';
import { ValidationException } from '../../../core/exceptions/validation.exception';

const baseOperation = {
    coinAmount: 1000,
    merchantId: 'ab6c9936-2946-4f12-9202-712930bccd19',
    ecomOperationId: '3c1a5663-3d22-46f1-a6e2-0e6ef87a607c',
    status: 'SUCCESS',
    transactionCurrency: '980',
    transactionResponseInfo: { actionCode: '0', responseCode: '00', description: 'approved' },
    hppOrderId: '1785849359482D7ntGvMdFP_',
};

describe('OperationPreAuthSchema', () => {
    const validPreAuth = { ...baseOperation, type: 'PREAUTH' };

    it('should validate a valid PREAUTH operation', () => {
        expect(() => DtoValidator.validate(validPreAuth, OperationPreAuthSchema)).not.toThrow();
    });

    it('should reject type = PURCHASE (literal mismatch)', () => {
        const invalid = { ...validPreAuth, type: 'PURCHASE' };
        expect(() => DtoValidator.validate(invalid, OperationPreAuthSchema)).toThrow(ValidationException);
    });

    it('should reject type = COMPLETION (literal mismatch)', () => {
        const invalid = { ...validPreAuth, type: 'COMPLETION' };
        expect(() => DtoValidator.validate(invalid, OperationPreAuthSchema)).toThrow(ValidationException);
    });

    it('should reject if merchantId is missing', () => {
        const { merchantId, ...invalid } = validPreAuth;
        expect(() => DtoValidator.validate(invalid, OperationPreAuthSchema)).toThrow(ValidationException);
    });

    it('should reject if ecomOperationId is empty', () => {
        const invalid = { ...validPreAuth, ecomOperationId: '' };
        expect(() => DtoValidator.validate(invalid, OperationPreAuthSchema)).toThrow(ValidationException);
    });

    it('should accept optional fields (rrn, operationId, etc.) being absent', () => {
        expect(() => DtoValidator.validate(validPreAuth, OperationPreAuthSchema)).not.toThrow();
    });
});

describe('OperationCompletionSchema', () => {
    const validCompletion = {
        ...baseOperation,
        type: 'COMPLETION',
        rrnPreauth: '621610670831',
        preauthOperationId: '1785840105543ovr-HqqpbrZ',
        preauthCoinAmount: 1000,
        preauthEcomOperationId: '78093fa9-6c65-489f-8907-2aff145a37a9',
    };

    it('should validate a valid COMPLETION operation with all preauth fields', () => {
        expect(() => DtoValidator.validate(validCompletion, OperationCompletionSchema)).not.toThrow();
    });

    it('should validate a COMPLETION operation without optional preauth fields', () => {
        const minimal = { ...baseOperation, type: 'COMPLETION' };
        expect(() => DtoValidator.validate(minimal, OperationCompletionSchema)).not.toThrow();
    });

    it('should reject type = PREAUTH (literal mismatch)', () => {
        const invalid = { ...validCompletion, type: 'PREAUTH' };
        expect(() => DtoValidator.validate(invalid, OperationCompletionSchema)).toThrow(ValidationException);
    });

    it('should reject preauthCoinAmount as float (not int)', () => {
        const invalid = { ...validCompletion, preauthCoinAmount: 100.5 };
        expect(() => DtoValidator.validate(invalid, OperationCompletionSchema)).toThrow(
            'Invalid input: expected int, received number for field preauthCoinAmount'
        );
    });

    it('should accept preauthCoinAmount absent (optional)', () => {
        const { preauthCoinAmount, ...valid } = validCompletion;
        expect(() => DtoValidator.validate(valid, OperationCompletionSchema)).not.toThrow();
    });

    it('should reject if hppOrderId is missing', () => {
        const { hppOrderId, ...invalid } = validCompletion;
        expect(() => DtoValidator.validate(invalid, OperationCompletionSchema)).toThrow(ValidationException);
    });

    it('should accept COMPLETION with null preauth fields (узгодженість з CompletionResponseSchema)', () => {
        const withNulls = {
            ...baseOperation,
            type: 'COMPLETION',
            rrnPreauth: null,
            preauthOperationId: null,
            preauthCoinAmount: null,
            preauthEcomOperationId: null,
        };
        expect(() => DtoValidator.validate(withNulls, OperationCompletionSchema)).not.toThrow();
    });
});

describe('OperationSchemaUnion — discriminated union по type', () => {
    it('should accept type = PREAUTH via union', () => {
        const data = { ...baseOperation, type: 'PREAUTH' };
        expect(() => DtoValidator.validate(data, OperationSchemaUnion)).not.toThrow();
    });

    it('should accept type = COMPLETION via union', () => {
        const data = {
            ...baseOperation,
            type: 'COMPLETION',
            preauthCoinAmount: 1000,
        };
        expect(() => DtoValidator.validate(data, OperationSchemaUnion)).not.toThrow();
    });

    it('should accept type = PURCHASE via union', () => {
        const data = { ...baseOperation, type: 'PURCHASE' };
        expect(() => DtoValidator.validate(data, OperationSchemaUnion)).not.toThrow();
    });

    it('should accept type = REFUND via union', () => {
        const data = { ...baseOperation, type: 'REFUND' };
        expect(() => DtoValidator.validate(data, OperationSchemaUnion)).not.toThrow();
    });

    it('should accept type = ACCOUNT_2_ACCOUNT via union', () => {
        const data = { ...baseOperation, type: 'ACCOUNT_2_ACCOUNT' };
        expect(() => DtoValidator.validate(data, OperationSchemaUnion)).not.toThrow();
    });

    it('should reject unknown type via union', () => {
        const data = { ...baseOperation, type: 'UNKNOWN_TYPE' };
        expect(() => DtoValidator.validate(data, OperationSchemaUnion)).toThrow(ValidationException);
    });

    it('should reject COMPLETION with float preauthCoinAmount via union', () => {
        const data = { ...baseOperation, type: 'COMPLETION', preauthCoinAmount: 50.5 };
        expect(() => DtoValidator.validate(data, OperationSchemaUnion)).toThrow(ValidationException);
    });
});
