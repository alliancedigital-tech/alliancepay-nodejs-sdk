import { compactVerify, importJWK, decodeProtectedHeader } from 'jose';
import { API } from '../constants/api';
import { JwsVerificationException } from '../exceptions/base.exception';
import { bankPublicKeyCache, BankPublicKeyJwk } from './bank-public-key-cache';

export interface JwsVerifyOptions {
    baseUrl: string;
    apiVersion?: string;
}

export class JwsVerifier {
    public static async verify<T = any>(jws: string, options: JwsVerifyOptions): Promise<T> {
        let header;
        try {
            header = decodeProtectedHeader(jws);
        } catch (error: any) {
            throw new JwsVerificationException(
                `JWS parse error: ${error.message}`,
                'JWS_PARSE_ERROR',
                error
            );
        }

        const kid = header.kid as string | undefined;
        const alg = header.alg as string | undefined;

        if (!kid || !alg) {
            throw new JwsVerificationException(
                'JWS is missing kid or alg in header.',
                'JWS_HEADER_INVALID',
                header
            );
        }

        const jwk = await this.fetchBankPublicKey(kid, options);

        let key;
        try {
            key = await importJWK(jwk as any, alg);
        } catch (error: any) {
            throw new JwsVerificationException(
                `Invalid public key for kid=${kid}`,
                'JWS_INVALID_KEY',
                error
            );
        }

        try {
            const { payload } = await compactVerify(jws, key, { algorithms: [alg] });
            return JSON.parse(new TextDecoder().decode(payload)) as T;
        } catch (error: any) {
            throw new JwsVerificationException(
                `JWS verification failed: ${error.message}`,
                'JWS_VERIFICATION_FAILED',
                error
            );
        }
    }

    private static async fetchBankPublicKey(kid: string, options: JwsVerifyOptions): Promise<BankPublicKeyJwk> {
        const cached = bankPublicKeyCache.get(kid);
        if (cached) return cached;

        const url = new URL(API.ENDPOINT_PUBLIC_KEY, options.baseUrl).toString();

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': API.REQUEST_CONTENT_TYPE_JSON,
                'Accept': API.REQUEST_CONTENT_TYPE_JSON,
                'x-api_version': options.apiVersion ?? API.X_API_VERSION,
            },
            body: JSON.stringify({ kid }),
        });

        if (!response.ok) {
            const text = await response.text().catch(() => '');
            throw new JwsVerificationException(
                `Cannot fetch bank public key (kid=${kid}): HTTP ${response.status} ${text}`,
                'JWS_PUBLIC_KEY_FETCH_FAILED',
                { status: response.status }
            );
        }

        const jwk = await response.json() as BankPublicKeyJwk;

        if (!jwk?.kty || !jwk?.crv || !jwk?.x || !jwk?.y) {
            throw new JwsVerificationException(
                `Invalid public key response from bank for kid=${kid}`,
                'JWS_INVALID_KEY_RESPONSE',
                jwk
            );
        }

        bankPublicKeyCache.set(kid, jwk);
        return jwk;
    }
}
