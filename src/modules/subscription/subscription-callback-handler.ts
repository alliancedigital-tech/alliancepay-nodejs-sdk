import { DtoValidator } from '../../core/validator/dto-validator';
import { ValidationException } from '../../core/exceptions/validation.exception';
import { API } from '../../core/constants/api';
import { JwsVerifier } from '../../core/jws/jws-verifier';
import { isCompactJws } from '../../core/jws/jws-format.util';
import { SubscriptionCallbackDTO, SubscriptionCallbackSchema } from './dto/subscription-callback.dto';

export interface SubscriptionCallbackVerifyOptions {
    baseUrl: string;
}

export class SubscriptionCallbackHandler {
    /** Signature verification is the first action; nothing is parsed before it succeeds. */
    public async handle(rawData: unknown, options: SubscriptionCallbackVerifyOptions): Promise<SubscriptionCallbackDTO> {
        const payload = await this.resolvePayload(rawData, options);

        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            throw new ValidationException(['Callback payload must be a JSON object.']);
        }

        const data = DtoValidator.validate(payload, SubscriptionCallbackSchema);
        return new SubscriptionCallbackDTO(data, payload as Record<string, unknown>);
    }

    private async resolvePayload(rawData: unknown, options: SubscriptionCallbackVerifyOptions): Promise<unknown> {
        if (typeof rawData === 'string') {
            if (isCompactJws(rawData)) {
                return JwsVerifier.verify(rawData.trim(), { baseUrl: options.baseUrl, apiVersion: API.X_API_VERSION });
            }
            try {
                return JSON.parse(rawData);
            } catch {
                throw new ValidationException(['Callback body is not valid JSON and not a valid JWS token.']);
            }
        }

        if (rawData && typeof rawData === 'object') {
            return rawData;
        }

        throw new ValidationException(['Callback body must be a JSON object, JSON string, or compact JWS token.']);
    }
}
