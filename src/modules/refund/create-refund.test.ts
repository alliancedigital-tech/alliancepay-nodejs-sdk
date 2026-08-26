import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateRefundService } from './create-refund';
import { DtoValidator } from '../../core/validator/dto-validator';
import { API } from '../../core/constants/api';
import { RefundException, AllianceSdkException } from '../../core/exceptions/base.exception';
import { ValidationException } from '../../core/exceptions/validation.exception';

describe('CreateRefundService', () => {
    let service: CreateRefundService;
    let mockHttpClient: any;
    let mockEncryptionService: any;

    const mockAuthDto: any = {
        serverPublic: { kty: 'EC', x: '...', y: '...' },
        authenticationKey: 'private-key-json'
    };

    const mockRequestData: any = {
        merchantRequestId: 'req-123',
        merchantId: 'm-1',
        operationId: 'op-1',
        coinAmount: 1000,
        date: '2023-10-10'
    };

    const mockEncryptedPayload = 'ey...encrypted.data';
    const mockJweResponse = { jwe: 'ey...encrypted.response' };
    const mockDecryptedResponse = {
        status: 'success',
        rrn: '123456789',
        type: 'refund'
    };

    beforeEach(() => {
        mockHttpClient = {
            post: vi.fn().mockResolvedValue(mockJweResponse)
        };

        mockEncryptionService = {
            encrypt: vi.fn().mockResolvedValue(mockEncryptedPayload),
            decrypt: vi.fn().mockResolvedValue(mockDecryptedResponse)
        };

        service = new CreateRefundService(mockHttpClient, mockEncryptionService);

        vi.clearAllMocks();
        vi.spyOn(DtoValidator, 'validate').mockImplementation((data: any) => data);
    });

    it('should successfully create a refund', async () => {
        const result = await service.createRefund(mockRequestData, mockAuthDto);

        expect(DtoValidator.validate).toHaveBeenCalledWith(mockRequestData, expect.any(Object));

        expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(
            mockRequestData,
            JSON.stringify(mockAuthDto.serverPublic)
        );

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            API.ENDPOINT_REFUND,
            mockEncryptedPayload,
            mockAuthDto,
            false
        );

        expect(mockEncryptionService.decrypt).toHaveBeenCalledWith(
            mockJweResponse.jwe,
            mockAuthDto.authenticationKey
        );

        expect(result).toEqual(mockDecryptedResponse);
    });

    it('should throw AllianceSdkException if validation fails', async () => {
        vi.spyOn(DtoValidator, 'validate').mockImplementation(() => {
            throw new AllianceSdkException('Validation failed', 'b_validation_failed');
        });

        await expect(service.createRefund(mockRequestData, mockAuthDto))
            .rejects.toThrow(AllianceSdkException);
    });

    it('should handle encryption errors via ApiErrorHandler', async () => {
        const encryptionError = new Error('Encryption failed');
        mockEncryptionService.encrypt.mockRejectedValue(encryptionError);

        await expect(service.createRefund(mockRequestData, mockAuthDto))
            .rejects.toThrow(RefundException);
    });

    it('should handle HTTP errors via ApiErrorHandler', async () => {
        mockHttpClient.post.mockRejectedValue(new Error('Network error'));

        await expect(service.createRefund(mockRequestData, mockAuthDto))
            .rejects.toThrow(RefundException);
    });

    it('should handle decryption errors via ApiErrorHandler', async () => {
        mockEncryptionService.decrypt.mockRejectedValue(new Error('Decryption failed'));

        await expect(service.createRefund(mockRequestData, mockAuthDto))
            .rejects.toThrow(RefundException);
    });

    it('should convert sourceAmount + conversionRate into coinAmount before validation', async () => {
        const { coinAmount, ...rest } = mockRequestData;
        const requestWithConversion = { ...rest, sourceAmount: 10, conversionRate: 39.5 };

        await service.createRefund(requestWithConversion, mockAuthDto);

        expect(DtoValidator.validate).toHaveBeenCalledWith(
            expect.objectContaining({ coinAmount: 39500 }),
            expect.any(Object)
        );
        expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(
            expect.objectContaining({ coinAmount: 39500 }),
            JSON.stringify(mockAuthDto.serverPublic)
        );

        const validatedPayload = (DtoValidator.validate as any).mock.calls[0][0];
        expect(validatedPayload.sourceAmount).toBeUndefined();
        expect(validatedPayload.conversionRate).toBeUndefined();
    });

    it('should use coinAmount as-is when sourceAmount/conversionRate are not provided', async () => {
        await service.createRefund(mockRequestData, mockAuthDto);

        expect(DtoValidator.validate).toHaveBeenCalledWith(
            expect.objectContaining({ coinAmount: mockRequestData.coinAmount }),
            expect.any(Object)
        );
    });

    it('should reject sourceAmount without conversionRate instead of silently falling back to a stale coinAmount', async () => {
        const req = { ...mockRequestData, coinAmount: 1, sourceAmount: 10 };

        await expect(service.createRefund(req, mockAuthDto))
            .rejects.toThrow(ValidationException);
        expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should reject conversionRate without sourceAmount instead of silently falling back to a stale coinAmount', async () => {
        const req = { ...mockRequestData, coinAmount: 1, conversionRate: 39.5 };

        await expect(service.createRefund(req, mockAuthDto))
            .rejects.toThrow(ValidationException);
        expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should use the converted amount over a stale coinAmount when both are provided', async () => {
        const req = { ...mockRequestData, coinAmount: 1, sourceAmount: 10, conversionRate: 39.5 };

        await service.createRefund(req, mockAuthDto);

        expect(DtoValidator.validate).toHaveBeenCalledWith(
            expect.objectContaining({ coinAmount: 39500 }),
            expect.any(Object)
        );
        expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(
            expect.objectContaining({ coinAmount: 39500 }),
            JSON.stringify(mockAuthDto.serverPublic)
        );
    });
});
