import { describe, it, expect, vi } from 'vitest';
import { CreateFiscalizationService } from './create-fiscalization';
import { FiscalizationException, GeneralApiException } from '../../core/exceptions/base.exception';
import { ValidationException } from '../../core/exceptions/validation.exception';
import { IHttpClient } from '../../core/http/http-client.interface';
import { API } from '../../core/constants/api';
import { AuthorizationDto } from '../auth/dto/authorization.dto';

const auth: AuthorizationDto = { baseUrl: 'https://bank.test', merchantId: 'm', jwsPrivateKey: 'k', jwsKeyId: 'kid' };

const request = () => ({
    merchantRequestId: 'req-1', merchantId: 'm', operationId: 'op-1',
    notificationUrl: 'https://merchant.test/cb',
    products: [{ id: 'p1', name: 'Item', count: 1, measurementCode: '0001', unitPrice: 10 }],
});

const serviceWith = (post: IHttpClient['post']) => ({ service: new CreateFiscalizationService({ post } as IHttpClient), post });

const businessError = (msgCode: string, extra: object = {}) =>
    new GeneralApiException(msgCode, msgCode, { status: 400, msgType: 'ERROR', msgCode, msgText: msgCode, ...extra });

describe('CreateFiscalizationService', () => {
    it('posts the validated, normalized body to the fiscalization endpoint', async () => {
        const post = vi.fn().mockResolvedValue({ operationId: 'op-1', status: 'PENDING' });
        const { service } = serviceWith(post as any);

        await service.createFiscalization({ ...request(), receiptComment: null }, auth);

        expect(post).toHaveBeenCalledWith(API.ENDPOINT_FISCALIZATION_CREATE, expect.not.objectContaining({ receiptComment: null }), auth);
        expect(API.ENDPOINT_FISCALIZATION_CREATE).toBe('/ecom/jws/cashbox/v2/fiscalization/create');
    });

    it('returns PENDING as is', async () => {
        const { service } = serviceWith(vi.fn().mockResolvedValue({ operationId: 'op-1', status: 'PENDING' }) as any);
        await expect(service.createFiscalization(request(), auth)).resolves.toMatchObject({ status: 'PENDING' });
    });

    it('returns SUCCESS with fiscal data', async () => {
        const { service } = serviceWith(vi.fn().mockResolvedValue({
            operationId: 'op-1', status: 'SUCCESS', operationType: 'PURCHASE', fiscalNumber: 'FN1',
            receiptUrl: 'https://r.test/1', fiscalizationDateTime: '2026-09-03T10:39:09.540+03:00', errorCode: null,
        }) as any);
        await expect(service.createFiscalization(request(), auth)).resolves.toMatchObject({ fiscalNumber: 'FN1', receiptUrl: 'https://r.test/1' });
    });

    it('returns FAIL (HTTP 200) as a normal response, not an exception', async () => {
        const { service } = serviceWith(vi.fn().mockResolvedValue({
            operationId: 'op-1', status: 'FAIL', errorCode: 541, errorDescription: 'Помилка під час підписання',
        }) as any);
        await expect(service.createFiscalization(request(), auth)).resolves.toMatchObject({ status: 'FAIL', errorCode: 541 });
    });

    it('tolerates unknown statuses and extra fields', async () => {
        const { service } = serviceWith(vi.fn().mockResolvedValue({ operationId: 'op-1', status: 'SOMETHING_NEW', extra: 1 }) as any);
        await expect(service.createFiscalization(request(), auth)).resolves.toMatchObject({ status: 'SOMETHING_NEW', extra: 1 });
    });

    it.each(['missing_required_field', 'invalid_format', 'payment_not_found', 'original_receipt_not_found'])(
        'maps HTTP 400 %s to FiscalizationException with the same code',
        async (msgCode) => {
            const { service } = serviceWith(vi.fn().mockRejectedValue(businessError(msgCode, { msgAttrs: ['operationId'] })) as any);

            const error: any = await service.createFiscalization(request(), auth).catch((e) => e);

            expect(error).toBeInstanceOf(FiscalizationException);
            expect(error.code).toBe(msgCode);
            expect(error.message).toContain('[400]');
            expect(error.rawPayload.msgAttrs).toEqual(['operationId']);
        }
    );

    it('wraps 5xx into FiscalizationException', async () => {
        const err = new GeneralApiException('boom', '503', { status: 503, raw: 'Service Unavailable' });
        const { service } = serviceWith(vi.fn().mockRejectedValue(err) as any);
        const error: any = await service.createFiscalization(request(), auth).catch((e) => e);
        expect(error).toBeInstanceOf(FiscalizationException);
        expect(error.message).toContain('[503]');
    });

    it('wraps a timeout into FiscalizationException(REQUEST_TIMEOUT)', async () => {
        const err = new GeneralApiException('timeout', 'REQUEST_TIMEOUT', { msgCode: 'REQUEST_TIMEOUT', msgText: 'timeout' });
        const { service } = serviceWith(vi.fn().mockRejectedValue(err) as any);
        await expect(service.createFiscalization(request(), auth)).rejects.toMatchObject({ code: 'REQUEST_TIMEOUT' });
    });

    it('wraps a network error', async () => {
        const { service } = serviceWith(vi.fn().mockRejectedValue(new TypeError('fetch failed')) as any);
        const error: any = await service.createFiscalization(request(), auth).catch((e) => e);
        expect(error).toBeInstanceOf(FiscalizationException);
        expect(error.message).toContain('fetch failed');
    });

    it('does not send anything when local validation fails', async () => {
        const post = vi.fn();
        const { service } = serviceWith(post as any);

        const { notificationUrl, ...noUrl } = request();
        await expect(service.createFiscalization(noUrl, auth)).rejects.toBeInstanceOf(ValidationException);
        await expect(service.createFiscalization({ ...request(), products: [] }, auth)).rejects.toBeInstanceOf(ValidationException);
        const taxNoClass = { ...request(), products: [{ ...request().products[0], taxCode: 7 }] };
        await expect(service.createFiscalization(taxNoClass, auth)).rejects.toBeInstanceOf(ValidationException);

        expect(post).not.toHaveBeenCalled();
    });

    it('treats a bank ERROR body in a 200 reply as FiscalizationException', async () => {
        const { service } = serviceWith(vi.fn().mockResolvedValue({ msgType: 'ERROR', msgCode: 'payment_not_found', msgText: 'nope' }) as any);
        await expect(service.createFiscalization(request(), auth)).rejects.toBeInstanceOf(FiscalizationException);
    });
});
