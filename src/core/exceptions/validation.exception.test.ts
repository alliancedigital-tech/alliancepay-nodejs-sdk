import { describe, it, expect } from 'vitest';
import { ValidationException } from './validation.exception';

describe('ValidationException', () => {
    it('should correctly format a message with several errors', () => {
        const errors = ['Email is invalid', 'Password is too short'];
        const exception = new ValidationException(errors);

        expect(exception.message).toBe('Validation failed: Email is invalid; Password is too short');
    });

    it('must store an array of errors in the errors property', () => {
        const errors = ['Required field'];
        const exception = new ValidationException(errors);

        expect(exception.errors).toEqual(errors);
        expect(Array.isArray(exception.errors)).toBe(true);
    });

    it('must set the correct error name', () => {
        const exception = new ValidationException([]);
        expect(exception.name).toBe('ValidationException');
    });

    it('must be an instance of the Error class', () => {
        const exception = new ValidationException([]);
        expect(exception).toBeInstanceOf(Error);
    });
});
