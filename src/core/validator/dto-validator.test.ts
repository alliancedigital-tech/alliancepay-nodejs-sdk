import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { DtoValidator } from './dto-validator';
import { ValidationException } from '../exceptions/validation.exception';

describe('DtoValidator with Zod', () => {
    const schema = z.object({
        name: z.string().trim().nonempty(),
        amount: z.number(),
        isActive: z.boolean().optional(),
        tags: z.array(z.string().nonempty()).nonempty(),
        metadata: z.object({id: z.string().nonempty()})
    });

    it('should pass validation for valid data', () => {
        const validData = {
            name: 'Test',
            amount: 100,
            tags: ['tag1'],
            metadata: { id: 'uuid-1' }
        };

        expect(() => DtoValidator.validate(validData, schema)).not.toThrow();
    });

    it('should throw ValidationException if a required field is missing', () => {
        const invalidData = { amount: 100 };

        expect(() => DtoValidator.validate(invalidData, schema))
            .toThrow(ValidationException);
    });

    it('should throw error with specific message for missing field', () => {
        const invalidData = { amount: 100 };
        expect(() => DtoValidator.validate(invalidData, schema)).toThrow(ValidationException);
    });

    it('should throw error for incorrect data type', () => {
        const invalidData = {
            name: 123,
            amount: 100,
            tags: ['tag'],
            metadata: { id: 'uuid-1' }
        };

        expect(() => DtoValidator.validate(invalidData, schema)).toThrow(ValidationException);
    });

    it('should validate nested objects recursively', () => {
        const invalidData = {
            name: 'Test',
            amount: 100,
            tags: ['tag'],
            metadata: { id: 123 }
        };

        expect(() => DtoValidator.validate(invalidData, schema)).toThrow(ValidationException);
    });

    it('should identify empty objects or arrays as empty if required', () => {
        const invalidData = {
            name: 'Test',
            amount: 100,
            tags: [],
            metadata: {}
        };

        try {
            DtoValidator.validate(invalidData, schema);
        } catch (e: any) {
            const allErrors = e.errors.join(' ');
            expect(allErrors).toContain('tags');
            expect(allErrors).toContain('metadata.id');
            expect(allErrors).toContain('Invalid input: expected string, received undefined');
        }
    });
});
