import { API } from '../../constants/api';
import { AuthorizationDto } from '../../../modules/auth/dto/authorization.dto';
import { RequestConfig } from '../http-client.interface';
import { GenerateRequestIdentification } from '../../utils/request-identification';

export class RequestBuilder {
    private requestId: string | null = null;

    public buildOptionsFromAuthDto(
        authDto: AuthorizationDto,
        data: string | object,
        isJsonContent: boolean = true
    ): RequestConfig {

        const headers: Record<string, string> = {
            'x-api_version': API.X_API_VERSION,
            'x-device_id': authDto.deviceId ?? '',
            'x-refresh_token': authDto.refreshToken ?? '',
            'x-request_id': this.requestId ?? GenerateRequestIdentification.generateRequestId(),
            'Content-Type': isJsonContent
                ? API.REQUEST_CONTENT_TYPE_JSON
                : API.REQUEST_CONTENT_TYPE_TEXT,
        };

        if (data && isJsonContent) {
            headers['Accept'] = API.REQUEST_CONTENT_TYPE_JSON;
        }

        return {
            headers,
            data: data
        };
    }
}
