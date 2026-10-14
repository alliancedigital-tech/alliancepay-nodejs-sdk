import { describe, it, expect, beforeAll, beforeEach, vi, afterEach } from 'vitest';
import { generateKeyPairSync } from 'node:crypto';
import { CompactSign, exportJWK, importPKCS8 } from 'jose';
import { JwsVerifier } from './jws-verifier';
import { JwsVerificationException } from '../exceptions/base.exception';
import { bankPublicKeyCache } from './bank-public-key-cache';

describe('JwsVerifier', () => {
    let publicJwk: any;
    let signToken: (payload: object, kid: string) => Promise<string>;

    beforeAll(async () => {
        const { privateKey, publicKey } = generateKeyPairSync('ec', {
            namedCurve: 'P-256',
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });

        const pkcs8PrivateKey = await importPKCS8(privateKey as unknown as string, 'ES256');
        publicJwk = await exportJWK(await import('jose').then(m => m.importSPKI(publicKey as unknown as string, 'ES256')));
        publicJwk.kid = 'bank-kid-1';
        publicJwk.alg = 'ES256';

        signToken = async (payload: object, kid: string) => {
            return await new CompactSign(new TextEncoder().encode(JSON.stringify(payload)))
                .setProtectedHeader({ alg: 'ES256', kid })
                .sign(pkcs8PrivateKey);
        };
    });

    beforeEach(() => {
        bankPublicKeyCache.clear();
        vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should verify a valid ES256 token and return its claims', async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => publicJwk,
        });

        const token = await signToken({ hppOrderId: 'order-1' }, 'bank-kid-1');
        const result = await JwsVerifier.verify(token, { baseUrl: 'https://api.test.com' });

        expect(result).toEqual({ hppOrderId: 'order-1' });
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should cache the bank public key and avoid a second fetch for the same kid', async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => publicJwk,
        });

        const tokenA = await signToken({ a: 1 }, 'bank-kid-1');
        const tokenB = await signToken({ b: 2 }, 'bank-kid-1');

        await JwsVerifier.verify(tokenA, { baseUrl: 'https://api.test.com' });
        await JwsVerifier.verify(tokenB, { baseUrl: 'https://api.test.com' });

        expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw JwsVerificationException on an invalid/tampered signature', async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => publicJwk,
        });

        const token = await signToken({ a: 1 }, 'bank-kid-1');
        const tampered = token.slice(0, -2) + 'xx';

        await expect(JwsVerifier.verify(tampered, { baseUrl: 'https://api.test.com' }))
            .rejects.toThrow(JwsVerificationException);
    });

    it('should throw JwsVerificationException when the public key fetch fails (non-2xx)', async () => {
        (fetch as any).mockResolvedValue({
            ok: false,
            status: 404,
            text: async () => 'not found',
        });

        const token = await signToken({ a: 1 }, 'unknown-kid');

        await expect(JwsVerifier.verify(token, { baseUrl: 'https://api.test.com' }))
            .rejects.toThrow(JwsVerificationException);
    });

    it('should throw JwsVerificationException when the public key response is missing required JWK fields', async () => {
        (fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ kty: 'EC' }),
        });

        const token = await signToken({ a: 1 }, 'bank-kid-1');

        await expect(JwsVerifier.verify(token, { baseUrl: 'https://api.test.com' }))
            .rejects.toThrow(JwsVerificationException);
    });

    it('should throw JwsVerificationException for a malformed token', async () => {
        await expect(JwsVerifier.verify('not-a-jws', { baseUrl: 'https://api.test.com' }))
            .rejects.toThrow(JwsVerificationException);
        expect(fetch).not.toHaveBeenCalled();
    });
});
