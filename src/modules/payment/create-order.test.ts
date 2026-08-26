import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateOrderService } from './create-order';
import { DtoValidator } from '../../core/validator/dto-validator';
import { API } from '../../core/constants/api';
import {
    AllianceSdkException, GeneralApiException,
    PaymentException
} from '../../core/exceptions/base.exception';

import {ValidationException} from '../../core/exceptions/validation.exception';

describe('CreateOrderService', () => {
    let service: CreateOrderService;
    let mockHttpClient: any;

    const mockAuthDto: any = {
        baseUrl: 'https://api.test.com',
        merchantId: 'm-123'
    };

    const mockOrderRequest: any = {
        amount: 100,
        currency: 'UAH',
        orderId: 'order-1'
    };

    const mockOrderResponse: any = {
        hppUrl: 'https://payment-page.com/123',
        hppOrderId: 'hpp-789'
    };

    beforeEach(() => {
        mockHttpClient = {
            post: vi.fn().mockResolvedValue(mockOrderResponse)
        };
        service = new CreateOrderService(mockHttpClient);
        vi.spyOn(DtoValidator, 'validate').mockImplementation((data: any) => data);
    });

    it('should successfully create order and validate response', async () => {
        const result = await service.createOrder(mockOrderRequest, mockAuthDto);

        expect(DtoValidator.validate).toHaveBeenNthCalledWith(
            1, mockOrderRequest, expect.any(Object)
        );

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            API.ENDPOINT_CREATE_ORDER,
            mockOrderRequest,
            mockAuthDto
        );

        expect(DtoValidator.validate).toHaveBeenNthCalledWith(
            2, mockOrderResponse, expect.any(Object)
        );

        expect(result).toEqual(mockOrderResponse);
    });

    it('should throw ValidationException if orderData is invalid', async () => {
        vi.spyOn(DtoValidator, 'validate').mockImplementationOnce(() => {
            throw new ValidationException(['amount is required']);
        });

        await expect(service.createOrder(mockOrderRequest, mockAuthDto))
            .rejects.toThrow(ValidationException);

        expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should throw ValidationException if API response is invalid', async () => {
        vi.spyOn(DtoValidator, 'validate')
            .mockImplementationOnce((data: any) => data)
            .mockImplementationOnce(() => {
                throw new ValidationException(['hppUrl is missing']);
            });

        await expect(service.createOrder(mockOrderRequest, mockAuthDto))
            .rejects.toThrow(ValidationException);
    });

    it('should handle HTTP errors via ApiErrorHandler as PaymentException', async () => {
        const networkError = new Error('Server 500');
        mockHttpClient.post.mockRejectedValue(networkError);

        await expect(service.createOrder(mockOrderRequest, mockAuthDto))
            .rejects.toThrow(PaymentException);
    });

    it('should not wrap AllianceSdkException in PaymentException', async () => {
        const sdkError = new AllianceSdkException('SDK internal error', '');
        mockHttpClient.post.mockRejectedValue(sdkError);

        try {
            await service.createOrder(mockOrderRequest, mockAuthDto);
        } catch (e) {
            expect(e).toBeInstanceOf(AllianceSdkException);
            expect(e).not.toBeInstanceOf(ValidationException);
        }
    });

    it('should reject hppPayType = A2A with a non-UAH currencyCode (real schema)', async () => {
        vi.restoreAllMocks();

        const a2aRequest = {
            merchantRequestId: 'REQ-1',
            merchantId: 'M-1',
            hppPayType: 'A2A',
            merchantComment: 'Transfer comment',
            directType: 'BANK_LINK',
            coinAmount: 100,
            paymentMethods: ['card'],
            successUrl: 'https://ok.com',
            failUrl: 'https://fail.com',
            statusPageType: 'REDIRECT',
            customerData: { senderCustomerId: 'CUST-001' },
            currencyCode: 840,
        };

        await expect(service.createOrder(a2aRequest as any, mockAuthDto))
            .rejects.toThrow(ValidationException);

        expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should POST the validator-applied defaults (currencyCode=980, generateQrNbu=false) when omitted (real schema)', async () => {
        vi.restoreAllMocks();

        const validOrderResponse = {
            hppOrderId: 'hpp-789',
            merchantRequestId: 'REQ-1',
            hppPayType: 'PURCHASE',
            paymentMethods: ['card'],
            orderStatus: 'CREATED',
            coinAmount: 100,
            merchantId: 'M-1',
            redirectUrl: 'https://payment-page.com/123',
            statusUrl: null,
        };

        mockHttpClient = {
            post: vi.fn().mockResolvedValue(validOrderResponse)
        };
        service = new CreateOrderService(mockHttpClient);

        const requestWithoutCurrencyCode = {
            merchantRequestId: 'REQ-1',
            merchantId: 'M-1',
            hppPayType: 'PURCHASE',
            coinAmount: 100,
            paymentMethods: ['card'],
            successUrl: 'https://ok.com',
            failUrl: 'https://fail.com',
            statusPageType: 'REDIRECT',
            customerData: { senderCustomerId: 'CUST-001' },
        };

        await service.createOrder(requestWithoutCurrencyCode as any, mockAuthDto);

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            API.ENDPOINT_CREATE_ORDER,
            expect.objectContaining({ currencyCode: 980, generateQrNbu: false }),
            mockAuthDto
        );
    });
});
