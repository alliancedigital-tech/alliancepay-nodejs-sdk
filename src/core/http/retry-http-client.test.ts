import { describe, it, expect, vi } from 'vitest';
import { RetryHttpClient } from './retry-http-client';

describe('RetryHttpClient', () => {
    it('should retry request once if first attempt returns 401', async () => {
        const mockBaseClient = { post: vi.fn() };
        const mockAuthService = { authorize: vi.fn() };

        mockBaseClient.post
            .mockRejectedValueOnce({ response: { status: 401 } })
            .mockResolvedValueOnce({ data: 'success' });

        const retryClient = new RetryHttpClient(mockBaseClient as any, mockAuthService as any);
        const result = await retryClient.post('/test', {}, {} as any);

        expect(mockAuthService.authorize).toHaveBeenCalledTimes(1);
        expect(mockBaseClient.post).toHaveBeenCalledTimes(2);
        expect(result).toEqual({ data: 'success' });
    });
});
