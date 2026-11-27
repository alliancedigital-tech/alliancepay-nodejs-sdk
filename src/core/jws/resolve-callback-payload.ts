import { API } from '../constants/api';
import { ValidationException } from '../exceptions/validation.exception';
import { JwsVerifier } from './jws-verifier';
import { isCompactJws } from './jws-format.util';

export interface CallbackVerifyOptions {
    baseUrl: string;
    /**
     * Accept a callback body that is not a signed compact JWS (plain JSON string / object).
     * Default `false`: unsigned bodies are rejected. Use only in tests / local development.
     */
    allowUnsigned?: boolean;
}

/**
 * Turns a raw callback body into a payload object. A compact JWS is signature-verified first.
 * Unsigned bodies (JSON string / object) are rejected unless `allowUnsigned` is explicitly set.
 */
export async function resolveCallbackPayload(rawData: unknown, options: CallbackVerifyOptions): Promise<unknown> {
    if (typeof rawData === 'string' && isCompactJws(rawData)) {
        return JwsVerifier.verify(rawData.trim(), { baseUrl: options.baseUrl, apiVersion: API.X_API_VERSION });
    }

    if (options.allowUnsigned !== true) {
        throw new ValidationException(['Unsigned callback rejected: a compact JWS token is required.']);
    }

    if (typeof rawData === 'string') {
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
