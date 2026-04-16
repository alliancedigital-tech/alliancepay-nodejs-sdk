import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CheckOrderService } from './check-order';
import { DtoValidator } from '../../core/validator/dto-validator';
import { API } from '../../core/constants/api';
import {
    AllianceSdkException,
    GeneralApiException
} from '../../core/exceptions/base.exception';
import {ValidationException} from '../../core/exceptions/validation.exception'

describe('CheckOrderService', () => {
    let service: CheckOrderService;
    let mockHttpClient: any;

    const mockAuthDto: any = {
        baseUrl: 'https://api.test.com',
        merchantId: 'm-123'
    };

    const mockHppOrderId = 'hpp-order-789';

    const mockApiResponse = {
        ecomOrderId: 'ecom-123',
        orderStatus: 'paid',
        operations: [
            { type: 'purchase', rrn: '111', status: 'success' }
        ]
    };

    beforeEach(() => {
        mockHttpClient = {
            post: vi.fn().mockResolvedValue(mockApiResponse)
        };
        service = new CheckOrderService(mockHttpClient);
        vi.spyOn(DtoValidator, 'validate').mockImplementation(() => {});
    });

    it('should successfully fetch and validate order data', async () => {
        const result = await service.checkOrderData(mockHppOrderId, mockAuthDto);

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            API.ENDPOINT_OPERATIONS,
            { hppOrderId: mockHppOrderId },
            mockAuthDto
        );

        expect(DtoValidator.validate).toHaveBeenCalledWith(
            mockApiResponse,
            expect.any(Object)
        );

        expect(result).toEqual(mockApiResponse);
    });

    it('should throw GeneralApiException if API response structure is invalid', async () => {
        vi.spyOn(DtoValidator, 'validate').mockImplementation(() => {
            throw new ValidationException(['Invalid status field']);
        });

        await expect(service.checkOrderData(mockHppOrderId, mockAuthDto))
            .rejects.toThrow(ValidationException);
    });

    it('should handle HTTP errors via ApiErrorHandler', async () => {
        const networkError = new Error('Connection timeout');
        mockHttpClient.post.mockRejectedValue(networkError);

        await expect(service.checkOrderData(mockHppOrderId, mockAuthDto))
            .rejects.toThrow(GeneralApiException);
    });

    it('should call ApiErrorHandler.handle when an unknown error occurs', async () => {
        const unknownError = new Error('Unknown');
        mockHttpClient.post.mockRejectedValue(unknownError);

        try {
            await service.checkOrderData(mockHppOrderId, mockAuthDto);
        } catch (e) {
            expect(e).toBeInstanceOf(GeneralApiException);
        }
    });
});
