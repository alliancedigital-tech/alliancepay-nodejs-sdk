import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CreateCompletionService } from './create-completion';
import { DtoValidator } from '../../core/validator/dto-validator';
import { API } from '../../core/constants/api';
import {
    AllianceSdkException,
    CompletionAmountException,
    CompletionException,
} from '../../core/exceptions/base.exception';
import { ValidationException } from '../../core/exceptions/validation.exception';

describe('CreateCompletionService', () => {
    let service: CreateCompletionService;
    let mockHttpClient: any;
    let mockEncryptionService: any;

    const mockAuthDto: any = {
        serverPublic: { kty: 'EC', x: '...', y: '...' },
        authenticationKey: 'private-key-json',
    };

    const mockCompletionRequest: any = {
        merchantRequestId: '6c8ea695-9dbd-484d-8b6b-2033f3a1bb23',
        merchantId: 'ab6c9936-2946-4f12-9202-712930bccd19',
        originalOperationId: '1785840105543ovr-HqqpbrZ',
        coinAmount: 25000,
        date: '2024-12-19 17:59:23.54+00:00',
    };

    const mockEncryptedPayload = 'ey...encrypted.completion';
    const mockJweResponse = { jwe: 'ey...encrypted.response' };
    const mockDecryptedResponse = {
        type: 'COMPLETION',
        coinAmount: 25000,
        merchantId: 'ab6c9936-2946-4f12-9202-712930bccd19',
        ecomOperationId: 'da0513cc-3332-40db-ad97-861bc0d330a4',
        status: 'SUCCESS',
        transactionCurrency: '980',
        transactionResponseInfo: { actionCode: '0', responseCode: '00', description: 'approved' },
        hppOrderId: '1785840083139JBGQkp6bfqU',
    };

    beforeEach(() => {
        mockHttpClient = {
            post: vi.fn().mockResolvedValue(mockJweResponse),
        };
        mockEncryptionService = {
            encrypt: vi.fn().mockResolvedValue(mockEncryptedPayload),
            decrypt: vi.fn().mockResolvedValue(mockDecryptedResponse),
        };
        service = new CreateCompletionService(mockHttpClient, mockEncryptionService);

        vi.clearAllMocks();
        vi.spyOn(DtoValidator, 'validate').mockImplementation(() => {});
    });

    it('should successfully create a completion', async () => {
        const originalCoinAmount = 25000;
        const result = await service.createCompletion(mockCompletionRequest, originalCoinAmount, mockAuthDto);

        expect(DtoValidator.validate).toHaveBeenCalledWith(mockCompletionRequest, expect.any(Object));

        expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(
            mockCompletionRequest,
            JSON.stringify(mockAuthDto.serverPublic)
        );

        expect(mockHttpClient.post).toHaveBeenCalledWith(
            API.ENDPOINT_COMPLETION,
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

    it('should accept coinAmount = originalCoinAmount (0% deviation)', async () => {
        const req = { ...mockCompletionRequest, coinAmount: 25000 };
        await expect(service.createCompletion(req, 25000, mockAuthDto)).resolves.toBeDefined();
    });

    it('should accept coinAmount = originalCoinAmount * 1.20 (рівно +20%)', async () => {
        const req = { ...mockCompletionRequest, coinAmount: 30000 };
        await expect(service.createCompletion(req, 25000, mockAuthDto)).resolves.toBeDefined();
    });

    it('should accept coinAmount = originalCoinAmount * 0.80 (рівно -20%)', async () => {
        const req = { ...mockCompletionRequest, coinAmount: 20000 };
        await expect(service.createCompletion(req, 25000, mockAuthDto)).resolves.toBeDefined();
    });

    it('should accept coinAmount = originalCoinAmount * 1.19 (в межах +20%)', async () => {
        const req = { ...mockCompletionRequest, coinAmount: 29750 };
        await expect(service.createCompletion(req, 25000, mockAuthDto)).resolves.toBeDefined();
    });

    it('should accept coinAmount = originalCoinAmount * 0.81 (в межах -20%)', async () => {
        const req = { ...mockCompletionRequest, coinAmount: 20250 };
        await expect(service.createCompletion(req, 25000, mockAuthDto)).resolves.toBeDefined();
    });

    it('should throw CompletionAmountException when coinAmount > originalCoinAmount * 1.20', async () => {
        const req = { ...mockCompletionRequest, coinAmount: 30001 };
        await expect(service.createCompletion(req, 25000, mockAuthDto))
            .rejects.toThrow(CompletionAmountException);
    });

    it('should throw CompletionAmountException when coinAmount < originalCoinAmount * 0.80', async () => {
        const req = { ...mockCompletionRequest, coinAmount: 19999 };
        await expect(service.createCompletion(req, 25000, mockAuthDto))
            .rejects.toThrow(CompletionAmountException);
    });

    it('CompletionAmountException should have code COMPLETION_AMOUNT_OUT_OF_RANGE', async () => {
        const req = { ...mockCompletionRequest, coinAmount: 99999 };
        try {
            await service.createCompletion(req, 25000, mockAuthDto);
            expect.fail('should have thrown');
        } catch (e: any) {
            expect(e).toBeInstanceOf(CompletionAmountException);
            expect(e.code).toBe('COMPLETION_AMOUNT_OUT_OF_RANGE');
        }
    });

    it('CompletionAmountException message should include allowed range', async () => {
        const req = { ...mockCompletionRequest, coinAmount: 99999 };
        try {
            await service.createCompletion(req, 25000, mockAuthDto);
        } catch (e: any) {
            expect(e.message).toContain('20000');
            expect(e.message).toContain('30000');
        }
    });

    it('should throw CompletionException on encryption error', async () => {
        mockEncryptionService.encrypt.mockRejectedValue(new Error('Encryption failed'));
        await expect(service.createCompletion(mockCompletionRequest, 25000, mockAuthDto))
            .rejects.toThrow(CompletionException);
    });

    it('should throw CompletionException on HTTP error', async () => {
        mockHttpClient.post.mockRejectedValue(new Error('Network error'));
        await expect(service.createCompletion(mockCompletionRequest, 25000, mockAuthDto))
            .rejects.toThrow(CompletionException);
    });

    it('should throw CompletionException on decryption error', async () => {
        mockEncryptionService.decrypt.mockRejectedValue(new Error('Decryption failed'));
        await expect(service.createCompletion(mockCompletionRequest, 25000, mockAuthDto))
            .rejects.toThrow(CompletionException);
    });

    it('should re-throw ValidationException without wrapping', async () => {
        vi.spyOn(DtoValidator, 'validate').mockImplementation(() => {
            throw new ValidationException(['coinAmount is required']);
        });
        await expect(service.createCompletion(mockCompletionRequest, 25000, mockAuthDto))
            .rejects.toThrow(ValidationException);
        expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should re-throw AllianceSdkException as-is without wrapping', async () => {
        const sdkError = new AllianceSdkException('SDK error', 'SDK_ERR');
        mockEncryptionService.encrypt.mockRejectedValue(sdkError);
        try {
            await service.createCompletion(mockCompletionRequest, 25000, mockAuthDto);
        } catch (e) {
            expect(e).toBeInstanceOf(AllianceSdkException);
            expect(e).not.toBeInstanceOf(CompletionException);
        }
    });
});
