import * as z from 'zod';
import { ValidationException } from '../exceptions/validation.exception';

export class DtoValidator {
    public static validate(data: any, schema: z.ZodSchema): void {
        try {
            schema.parse(data);
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errors: string[] = [];
                for (const errorItem of error.issues) {
                    const path = errorItem.path.join('.');
                    const fieldName = path || 'root';
                    errors.push(errorItem.message + ' for field ' + fieldName);
                }

                throw new ValidationException(errors);
            }
            throw error;
        }
    }
}
