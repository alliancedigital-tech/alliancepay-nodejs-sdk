import { CompactSign, importPKCS8 } from 'jose';
import { JwsSigningException } from '../exceptions/base.exception';
import { GenerateRequestIdentification } from '../utils/request-identification';

export interface JwsSignParams {
    privateKeyPem: string;
    kid: string;
    targetUrl: string;
    payloadJson: string;
}

export class JwsSigner {
    private static readonly ALG = 'RS256';

    public static async sign(params: JwsSignParams): Promise<string> {
        const { privateKeyPem, kid, targetUrl, payloadJson } = params;

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

        let privateKey;
        try {
            privateKey = await importPKCS8(privateKeyPem, this.ALG);
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
                    alg: this.ALG,
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
