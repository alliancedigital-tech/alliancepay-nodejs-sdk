import { DtoValidator } from '../../core/validator/dto-validator';
import { ValidationException } from '../../core/exceptions/validation.exception';
import { resolveCallbackPayload } from '../../core/jws/resolve-callback-payload';
import { SubscriptionCallbackDTO, SubscriptionCallbackSchema } from './dto/subscription-callback.dto';

export interface SubscriptionCallbackVerifyOptions {
    baseUrl: string;
    allowUnsigned?: boolean;
}

export class SubscriptionCallbackHandler {
    /** A valid JWS signature is required; unsigned bodies are rejected unless `allowUnsigned` is set. */
    public async handle(rawData: unknown, options: SubscriptionCallbackVerifyOptions): Promise<SubscriptionCallbackDTO> {
        const payload = await resolveCallbackPayload(rawData, options);

        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            throw new ValidationException(['Callback payload must be a JSON object.']);
        }

        const data = DtoValidator.validate(payload, SubscriptionCallbackSchema);
        return new SubscriptionCallbackDTO(data, payload as Record<string, unknown>);
    }
}
