import { describe, it, expect } from 'vitest';
import { DtoValidator } from '../../../core/validator/dto-validator';
import { AuthorizationSchema } from './authorization.dto';
import { ValidationException } from '../../../core/exceptions/validation.exception';

describe('AuthorizationSchema Validation', () => {
    const validAuthData = {
        baseUrl: 'https://api.test.com',
        merchantId: 'M123',
        jwsPrivateKey: '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----',
        jwsKeyId: 'kid-001'
    };

    it('should pass with valid authorization data', () => {
        expect(() => DtoValidator.validate(validAuthData, AuthorizationSchema)).not.toThrow(ValidationException);
    });

    it('should throw error if jwsPrivateKey is missing', () => {
        const { jwsPrivateKey, ...incompleteData } = validAuthData;
        expect(() => DtoValidator.validate(incompleteData, AuthorizationSchema)).toThrow(ValidationException);
    });

    it('should throw error if jwsPrivateKey is empty', () => {
        const invalidData = { ...validAuthData, jwsPrivateKey: '  ' };
        expect(() => DtoValidator.validate(invalidData, AuthorizationSchema)).toThrow(ValidationException);
    });

    it('should throw error if jwsKeyId is missing', () => {
        const { jwsKeyId, ...incompleteData } = validAuthData;
        expect(() => DtoValidator.validate(incompleteData, AuthorizationSchema)).toThrow(ValidationException);
    });

    it('should throw error if baseUrl is missing', () => {
        const { baseUrl, ...incompleteData } = validAuthData;
        expect(() => DtoValidator.validate(incompleteData, AuthorizationSchema)).toThrow(ValidationException);
    });
});
