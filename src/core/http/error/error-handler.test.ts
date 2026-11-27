import { describe, it, expect } from 'vitest';
import { ApiErrorHandler } from './error-handler';
import { PaymentException, GeneralApiException, RefundException } from '../../exceptions/base.exception';

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

describe('ApiErrorHandler.handle with GeneralApiException (non-2xx from FetchAdapter)', () => {
    it('preserves bank msgCode, status and message instead of falling back to 500', () => {
        const wrapped = new GeneralApiException('Operation not found', 'payment_not_found', {
            status: 400, msgType: 'ERROR', msgCode: 'payment_not_found', msgText: 'Operation not found', msgAttrs: ['operationId'],
        });

        let caught: any;
        try { ApiErrorHandler.handle(RefundException, wrapped); } catch (e) { caught = e; }

        expect(caught).toBeInstanceOf(RefundException);
        expect(caught.code).toBe('payment_not_found');
        expect(caught.message).toContain('[400]');
        expect(caught.rawPayload.msgAttrs).toEqual(['operationId']);
    });
});
