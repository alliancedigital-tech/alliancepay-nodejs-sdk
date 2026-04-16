import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RequestBuilder } from './request-builder';
import { API } from '../../constants/api';
import { AuthorizationDto } from '../../../modules/auth/dto/authorization.dto';
import { GenerateRequestIdentification } from '../../utils/request-identification';

describe('RequestBuilder', () => {
    let builder: RequestBuilder;
    let mockAuthDto: AuthorizationDto;

    beforeEach(() => {
        builder = new RequestBuilder();

        mockAuthDto = {
            baseUrl: 'https://api.test.com',
            merchantId: 'm-123',
            serviceCode: 's-456',
            authenticationKey: { key: 'val' },
            deviceId: 'device-789',
            refreshToken: 'refresh-token-abc'
        };

        vi.spyOn(GenerateRequestIdentification, 'generateRequestId')
            .mockReturnValue('mocked-uuid');
    });

    it('should build basic headers correctly from AuthDto', () => {
        const data = { test: 'payload' };
        const result = builder.buildOptionsFromAuthDto(mockAuthDto, data);

        expect(result.headers).toMatchObject({
            'x-api_version': API.X_API_VERSION,
            'x-device_id': 'device-789',
            'x-refresh_token': 'refresh-token-abc',
            'x-request_id': 'mocked-uuid',
            'Content-Type': API.REQUEST_CONTENT_TYPE_JSON,
            'Accept': API.REQUEST_CONTENT_TYPE_JSON
        });
        expect(result.data).toEqual(data);
    });

    it('should use empty strings if optional deviceId and refreshToken are missing', () => {
        const minimalAuthDto: AuthorizationDto = {
            baseUrl: 'https://api.test.com',
            merchantId: 'm-1',
            serviceCode: 's-1',
            authenticationKey: { k: 'v' }
        };

        const result = builder.buildOptionsFromAuthDto(minimalAuthDto, {});

        expect(result.headers['x-device_id']).toBe('');
        expect(result.headers['x-refresh_token']).toBe('');
    });

    it('should set TEXT content type when isJsonContent is false', () => {
        const data = 'plain text data';
        const result = builder.buildOptionsFromAuthDto(mockAuthDto, data, false);

        expect(result.headers['Content-Type']).toBe(API.REQUEST_CONTENT_TYPE_TEXT);
        expect(result.headers['Accept']).toBeUndefined();
    });

    it('should use internal requestId if it was previously set', () => {
        const customId = 'custom-request-id';
        (builder as any).requestId = customId;

        const result = builder.buildOptionsFromAuthDto(mockAuthDto, {});

        expect(result.headers['x-request_id']).toBe(customId);
        expect(GenerateRequestIdentification.generateRequestId).not.toHaveBeenCalled();
    });

    it('should include Accept header only if data is present and content is JSON', () => {
        const withData = builder.buildOptionsFromAuthDto(mockAuthDto, { id: 1 }, true);
        expect(withData.headers['Accept']).toBe(API.REQUEST_CONTENT_TYPE_JSON);

        const withoutData = builder.buildOptionsFromAuthDto(mockAuthDto, null as any, true);
        expect(withoutData.headers['Accept']).toBeUndefined();
    });
});
