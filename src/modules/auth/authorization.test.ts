import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './authorization';
import { IHttpClient } from '../../core/http/http-client.interface';
import { EncryptionService } from '../../core/encryption/encryption';

describe('AuthService', () => {
    let authService: AuthService;
    let mockHttp: IHttpClient;
    let mockEncryption: EncryptionService;
    let onTokenUpdateMock: any;

    const mockAuthDto: any = {
        serviceCode: 'test_service',
        merchantId: 'test_merchantId',
        authenticationKey: {"kty": "EC","use": "enc","crv": "P-384","x": "g4NSeivuFxFCkRo7mHgi6PA8_RFgO0obFZgT0ZufBT1hmvVF-4Zb9arnn7sbVHyT","y": "8ufRfdLcyh2OmOE9m35iNskBHt7JI3xGpB-gLzDpgD0pnxVEql0RIC5nL6z_TXN_","alg": "ECDH-ES+A256KW"},
        baseUrl: 'https://api.test.com'
    };

    beforeEach(() => {
        mockHttp = {
            post: vi.fn(),
            get: vi.fn()
        } as any;

        mockEncryption = {
            decrypt: vi.fn(),
            encrypt: vi.fn()
        } as any;

        onTokenUpdateMock = vi.fn();

        authService = new AuthService(mockHttp, mockEncryption, onTokenUpdateMock);
    });

    describe('isTokenValid', () => {
        it('should return false if token is missing', () => {
            expect(authService.isTokenValid({} as any)).toBe(false);
        });

        it('should return false if token expires in less than 30 seconds', () => {
            const nearExpiration = new Date();
            nearExpiration.setSeconds(nearExpiration.getSeconds() + 20);

            const dto = { ...mockAuthDto, authToken: 'token', tokenExpirationDateTime: nearExpiration };
            expect(authService.isTokenValid(dto)).toBe(false);
        });

        it('should return true if token is valid and expiration is far enough', () => {
            const farExpiration = new Date();
            farExpiration.setMinutes(farExpiration.getMinutes() + 10);

            const dto = { ...mockAuthDto, authToken: 'token', tokenExpirationDateTime: farExpiration };
            expect(authService.isTokenValid(dto)).toBe(true);
        });
    });

    describe('authorize', () => {
        it('should return same DTO and not call API if token is still valid', async () => {
            const validExpiration = new Date(Date.now() + 100000);
            const validExpirationStr = validExpiration.toISOString();
            const validDto = { ...mockAuthDto, authToken: 'valid', tokenExpirationDateTime: validExpirationStr };

            const result = await authService.authorize(validDto);

            expect(result).toBe(validDto);
            expect(mockHttp.post).not.toHaveBeenCalled();
        });

        it('should force re-authorization if reAuth flag is true, even if token is valid', async () => {
            const validExpiration = new Date(Date.now() + 100000);
            const validExpirationStr = validExpiration.toISOString();
            const validDto = { ...mockAuthDto, authToken: 'valid', tokenExpirationDateTime: validExpirationStr };

            mockHttp.post.mockResolvedValue({ jwe: 'encrypted_data' });
            mockEncryption.decrypt.mockResolvedValue({ authToken: 'new_token' });

            await authService.authorize(validDto, true);

            expect(mockHttp.post).toHaveBeenCalled();
        });

        it('should perform full auth cycle: request, decrypt, format date and trigger callback', async () => {
            const apiResponse = { jwe: 'encrypted_jwe_string', msgType: 'OK' };
            const decryptedData = {
                authToken: 'newly_generated_token',
                tokenExpirationDateTime: '2026-12-31T23:59:59Z'
            };

            mockHttp.post.mockResolvedValue(apiResponse);
            mockEncryption.decrypt.mockResolvedValue(decryptedData);

            const result = await authService.authorize(mockAuthDto);

            expect(mockHttp.post).toHaveBeenCalledWith(
                expect.any(String),
                { serviceCode: mockAuthDto.serviceCode },
                mockAuthDto
            );

            expect(mockEncryption.decrypt).toHaveBeenCalledWith('encrypted_jwe_string', mockAuthDto.authenticationKey);

            expect(result.authToken).toBe('newly_generated_token');
            expect(result.tokenExpirationDateTime).toBeInstanceOf(Date);

            expect(onTokenUpdateMock).toHaveBeenCalledWith(expect.objectContaining({
                authToken: 'newly_generated_token'
            }));
        });

        it('should throw AuthorizationException if API returns error status', async () => {
            const errorResponse = { msgType: 'ERROR', msgCode: 'b_auth_failed' };
            mockHttp.post.mockResolvedValue(errorResponse);

            await expect(authService.authorize(mockAuthDto)).rejects.toMatchObject({
            });
        });

        it('should use ApiErrorHandler to handle network failures', async () => {
            const networkError = new Error('Network timeout');
            mockHttp.post.mockRejectedValue(networkError);

            await expect(authService.authorize(mockAuthDto)).rejects.toThrow();
        });
    });
});
