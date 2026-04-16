import { describe, it, expect } from 'vitest';
import { DtoValidator } from '../../../core/validator/dto-validator';
import { AuthorizationSchema } from './authorization.dto';
import { ValidationException } from '../../../core/exceptions/validation.exception';

describe('AuthorizationSchema Validation', () => {
    const validAuthData = {
        baseUrl: 'https://api.test.com',
        merchantId: 'M123',
        serviceCode: 'S001',
        authenticationKey: { kty: 'RSA', n: '...' }
    };

    it('should pass with valid authorization data', () => {
        expect(() => DtoValidator.validate(validAuthData, AuthorizationSchema)).not.toThrow(ValidationException);
    });

    it('should throw error if authenticationKey is not an object', () => {
        const invalidData = { ...validAuthData, authenticationKey: 'string-key' };
        expect(() => DtoValidator.validate(invalidData, AuthorizationSchema)).toThrow(ValidationException);
    });

    it('should throw error if authenticationKey is empty', () => {
        const invalidData = { ...validAuthData, authenticationKey: {} };
        expect(() => DtoValidator.validate(invalidData, AuthorizationSchema)).toThrow(ValidationException);
    });

    it('should throw error if baseUrl is missing', () => {
        const { baseUrl, ...incompleteData } = validAuthData;
        expect(() => DtoValidator.validate(incompleteData, AuthorizationSchema)).toThrow(ValidationException);
    });
});
