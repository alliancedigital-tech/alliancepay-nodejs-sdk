import { DtoValidator } from '../../core/validator/dto-validator';
import { ValidationException } from '../../core/exceptions/validation.exception';
import { CallbackVerifyOptions, resolveCallbackPayload } from '../../core/jws/resolve-callback-payload';
import { FiscalizationCallbackDTO, FiscalizationCallbackSchema } from './dto/fiscalization-response.dto';

export class FiscalizationCallbackHandler {
    /** A valid JWS signature is required; unsigned bodies are rejected unless `options.allowUnsigned` is set. */
    public async handle(rawData: unknown, options: CallbackVerifyOptions): Promise<FiscalizationCallbackDTO> {
        const payload = await resolveCallbackPayload(rawData, options);

        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
            throw new ValidationException(['Callback payload must be a JSON object.']);
        }

        const data = DtoValidator.validate(payload, FiscalizationCallbackSchema);
        return new FiscalizationCallbackDTO(data, payload as Record<string, unknown>);
    }
}
