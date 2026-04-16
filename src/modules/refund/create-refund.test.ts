import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateRefundService } from './create-refund';
import { DtoValidator } from '../../core/validator/dto-validator';
import { API } from '../../core/constants/api';
import { RefundException, AllianceSdkException } from '../../core/exceptions/base.exception';

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
        vi.spyOn(DtoValidator, 'validate').mockImplementation(() => {});
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
});
