import { API, ENDPOINT_PREFIXES_WITHOUT_API_VERSION } from '../../constants/api';
import { AuthorizationDto } from '../../../modules/auth/dto/authorization.dto';
import { RequestConfig } from '../http-client.interface';
import { GenerateRequestIdentification } from '../../utils/request-identification';

export class RequestBuilder {
    private requestId: string | null = null;

    public buildOptionsFromAuthDto(
        authDto: AuthorizationDto,
        jwsBody: string,
        targetUrl?: string
    ): RequestConfig {

        const headers: Record<string, string> = {
            'x-api_version': API.X_API_VERSION,
            'x-request_id': this.requestId ?? GenerateRequestIdentification.generateRequestId(),
            'Content-Type': API.REQUEST_CONTENT_TYPE_JWS,
            'Accept': API.REQUEST_CONTENT_TYPE_JSON,
        };

        if (targetUrl && ENDPOINT_PREFIXES_WITHOUT_API_VERSION.some((prefix) => targetUrl.startsWith(prefix))) {
            delete headers['x-api_version'];
        }

        return {
            headers,
            data: jwsBody
        };
    }
}
