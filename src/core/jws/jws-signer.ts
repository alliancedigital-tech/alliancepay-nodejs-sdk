import { createPrivateKey } from 'node:crypto';
import { CompactSign, importPKCS8 } from 'jose';
import { JwsSigningException } from '../exceptions/base.exception';
import { GenerateRequestIdentification } from '../utils/request-identification';

export interface JwsSignParams {
    privateKeyPem: string;
    kid: string;
    targetUrl: string;
    payloadJson: string;
}

const PEM_BLOCK = /-----BEGIN ([A-Z ]+)-----([\s\S]*?)-----END \1-----/;

/**
 * Rebuilds a standard multi-line PEM from keys that lost their line breaks (single-line paste,
 * literal "\n" from .env/JSON, CRLF, surrounding quotes/whitespace). OpenSSL (createPrivateKey)
 * requires BEGIN/END on their own lines, unlike jose. Input without a PEM block is returned unchanged.
 */
export function normalizePrivateKeyPem(input: string): string {
    let text = input.trim().replace(/^(["'`])([\s\S]*)\1$/, '$2');
    text = text.replace(/\\r\\n|\\n|\\r/g, '\n');

    const match = PEM_BLOCK.exec(text);
    if (!match) return input;

    const body = match[2].replace(/\s+/g, '');
    if (!body) return input;

    const lines = body.match(/.{1,64}/g) ?? [];
    return `-----BEGIN ${match[1]}-----\n${lines.join('\n')}\n-----END ${match[1]}-----\n`;
}

export class JwsSigner {
    private static readonly ALG_RSA = 'RS256';
    private static readonly ALG_EC = 'ES256';
    private static readonly EC_CURVE = 'prime256v1';

    /** EC P-256 key -> ES256, RSA key -> RS256 (keeps existing RSA installations working). */
    private static resolveAlgorithm(privateKeyPem: string): string {
        let keyObject;
        try {
            keyObject = createPrivateKey(privateKeyPem);
        } catch (error: any) {
            throw new JwsSigningException(
                `JWS Private Key is invalid: ${error.message}`,
                'JWS_PRIVATE_KEY_INVALID',
                error
            );
        }

        const type = keyObject.asymmetricKeyType;
        if (type === 'rsa') return this.ALG_RSA;

        if (type === 'ec') {
            const curve = keyObject.asymmetricKeyDetails?.namedCurve;
            if (curve !== this.EC_CURVE) {
                throw new JwsSigningException(
                    `JWS Private Key must use the P-256 curve (prime256v1) for ES256, got: ${curve ?? 'unknown'}.`,
                    'JWS_PRIVATE_KEY_UNSUPPORTED_CURVE',
                    null
                );
            }
            return this.ALG_EC;
        }

        throw new JwsSigningException(
            `JWS Private Key type is not supported: ${type ?? 'unknown'}. Use EC P-256 (ES256) or RSA (RS256).`,
            'JWS_PRIVATE_KEY_UNSUPPORTED_TYPE',
            null
        );
    }

    public static async sign(params: JwsSignParams): Promise<string> {
        const { kid, targetUrl, payloadJson } = params;
        const privateKeyPem = normalizePrivateKeyPem(params.privateKeyPem ?? '');

        if (!privateKeyPem?.trim()) {
            throw new JwsSigningException(
                'JWS Private Key (PEM) is not configured.',
                'JWS_PRIVATE_KEY_MISSING',
                null
            );
        }

        if (!kid?.trim()) {
            throw new JwsSigningException(
                'JWS Key ID (kid) is not configured.',
                'JWS_KID_MISSING',
                null
            );
        }

        try {
            JSON.parse(payloadJson);
        } catch (error: any) {
            throw new JwsSigningException(
                'JWS: payload is not valid JSON.',
                'JWS_PAYLOAD_INVALID',
                error
            );
        }

        const alg = this.resolveAlgorithm(privateKeyPem);

        let privateKey;
        try {
            privateKey = await importPKCS8(privateKeyPem, alg);
        } catch (error: any) {
            throw new JwsSigningException(
                `JWS Private Key is invalid: ${error.message}`,
                'JWS_PRIVATE_KEY_INVALID',
                error
            );
        }

        try {
            return await new CompactSign(new TextEncoder().encode(payloadJson))
                .setProtectedHeader({
                    alg,
                    ts: String(Date.now()),
                    targetUrl,
                    kid,
                    jti: GenerateRequestIdentification.generateRequestId(),
                })
                .sign(privateKey);
        } catch (error: any) {
            throw new JwsSigningException(
                `JWS signing failed: ${error.message}`,
                'JWS_SIGNING_FAILED',
                error
            );
        }
    }
}
