import { IHttpClient } from '../http-client.interface';
import { RequestBuilder } from '../request/request-builder';
import { AuthorizationDto } from '../../../modules/auth/dto/authorization.dto';
import { GeneralApiException } from '../../exceptions/base.exception';
import { API } from '../../constants/api';
import { JwsSigner } from '../../jws/jws-signer';
import { JwsVerifier } from '../../jws/jws-verifier';
import { isCompactJws } from '../../jws/jws-format.util';

export class FetchAdapter implements IHttpClient {
    constructor(
        private readonly baseUrl: string,
        private readonly requestBuilder: RequestBuilder
    ) {}

    async post<T>(url: string, data: any, auth: AuthorizationDto): Promise<T> {
        const payloadJson = JSON.stringify(data ?? {});

        const jwsToken = await JwsSigner.sign({
            privateKeyPem: auth.jwsPrivateKey,
            kid: auth.jwsKeyId,
            targetUrl: url,
            payloadJson,
        });

        const config = this.requestBuilder.buildOptionsFromAuthDto(auth, jwsToken);
        const fullUrl = new URL(url, this.baseUrl).toString();

        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: config.headers,
            body: jwsToken
        });

        return this.handleResponse<T>(response);
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        const rawText = await response.text();
        const parsed = await this.parseBody(rawText);

        if (!response.ok) {
            const msgCode = (parsed && typeof parsed === 'object' && parsed.msgCode) || response.status.toString();
            const credentialsHint = response.status === 401
                ? 'Unauthorized: check JWS private key and key id (kid). '
                : '';
            const msgText = credentialsHint + ((parsed && typeof parsed === 'object' && parsed.msgText)
                || (typeof parsed === 'string' ? parsed : `Request failed with status ${response.status}`));

            throw new GeneralApiException(
                msgText,
                msgCode,
                { status: response.status, ...(parsed && typeof parsed === 'object' ? parsed : { raw: rawText }) }
            );
        }

        return parsed as T;
    }

    private async parseBody(rawText: string): Promise<any> {
        if (isCompactJws(rawText)) {
            return await JwsVerifier.verify(rawText, { baseUrl: this.baseUrl, apiVersion: API.X_API_VERSION });
        }

        try {
            return JSON.parse(rawText);
        } catch {
            return rawText;
        }
    }
}
