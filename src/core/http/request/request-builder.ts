import { API } from '../../constants/api';
import { AuthorizationDto } from '../../../modules/auth/dto/authorization.dto';
import { RequestConfig } from '../http-client.interface';
import { GenerateRequestIdentification } from '../../utils/request-identification';

export class RequestBuilder {
    private requestId: string | null = null;

    public buildOptionsFromAuthDto(
        authDto: AuthorizationDto,
        jwsBody: string
    ): RequestConfig {

        const headers: Record<string, string> = {
            'x-api_version': API.X_API_VERSION,
            'x-request_id': this.requestId ?? GenerateRequestIdentification.generateRequestId(),
            'Content-Type': API.REQUEST_CONTENT_TYPE_JWS,
            'Accept': API.REQUEST_CONTENT_TYPE_JSON,
        };

        return {
            headers,
            data: jwsBody
        };
    }
}
