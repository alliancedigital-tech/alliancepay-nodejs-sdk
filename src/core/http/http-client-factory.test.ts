import { describe, it, expect, vi } from 'vitest';
import { HttpClientFactory } from './http-client.factory';
import { FetchAdapter } from './adapters/fetch-adapter';

vi.mock('./adapters/fetch-adapter', () => {
    return {
        FetchAdapter: vi.fn().mockImplementation(function() {
            return {
                post: vi.fn(),
                get: vi.fn(),
            };
        })
    };
});

vi.mock('./request/request-builder', () => {
    return {
        RequestBuilder: vi.fn().mockImplementation(function() {
            return {};
        })
    };
});

describe('HttpClientFactory', () => {
    it('should return the passed adapter if it is specified in the options', () => {
        const customAdapter = { post: vi.fn(), get: vi.fn() } as any;
        const options = {
            baseUrl: 'https://api.test.com',
            adapter: customAdapter
        };

        const result = HttpClientFactory.create(options);

        expect(result).toBe(customAdapter);
    });

    it('should create a new AxiosAdapter if no adapter is passed', () => {
        const options = {
            baseUrl: 'https://api.test.com'
        };

        const result = HttpClientFactory.create(options);

        expect(result).toBeDefined();
        expect(FetchAdapter).toHaveBeenCalledWith(options.baseUrl, expect.any(Object));
    });
});
