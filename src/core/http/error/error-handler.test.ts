import { describe, it, expect } from 'vitest';
import { ApiErrorHandler } from './error-handler';
import { PaymentException } from '../../exceptions/base.exception';

it('should throw PaymentException for business error codes', () => {
    const errorResponse = {
        msgType: 'ERROR',
        msgCode: 'b_terminal_not_found',
        msgText: '@Terminal not found'
    };

    try {
        ApiErrorHandler.checkResponse(PaymentException, errorResponse);
        expect.fail('Should have thrown an exception');
    } catch (e: any) {
        expect(e).toBeInstanceOf(PaymentException);
        expect(e.code).toBe('b_terminal_not_found');
    }
});
