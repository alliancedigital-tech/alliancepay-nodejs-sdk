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
            jwsPrivateKey: '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----',
            jwsKeyId: 'kid-456'
        };

        vi.spyOn(GenerateRequestIdentification, 'generateRequestId')
            .mockReturnValue('mocked-uuid');
    });

    it('should build headers correctly from AuthDto and a signed JWS body', () => {
        const jwsBody = 'header.payload.signature';
        const result = builder.buildOptionsFromAuthDto(mockAuthDto, jwsBody);

        expect(result.headers).toMatchObject({
            'x-api_version': API.X_API_VERSION,
            'x-request_id': 'mocked-uuid',
            'Content-Type': API.REQUEST_CONTENT_TYPE_JWS,
            'Accept': API.REQUEST_CONTENT_TYPE_JSON
        });
        expect(result.data).toEqual(jwsBody);
    });

    it('should use internal requestId if it was previously set', () => {
        const customId = 'custom-request-id';
        (builder as any).requestId = customId;

        const result = builder.buildOptionsFromAuthDto(mockAuthDto, 'header.payload.signature');

        expect(result.headers['x-request_id']).toBe(customId);
        expect(GenerateRequestIdentification.generateRequestId).not.toHaveBeenCalled();
    });
});
