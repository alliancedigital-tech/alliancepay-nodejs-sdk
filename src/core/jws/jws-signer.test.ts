import { describe, it, expect, beforeAll, vi } from 'vitest';
import { generateKeyPairSync } from 'node:crypto';
import { decodeProtectedHeader, compactVerify, importSPKI } from 'jose';
import { JwsSigner, normalizePrivateKeyPem } from './jws-signer';
import { JwsSigningException } from '../exceptions/base.exception';
import { GenerateRequestIdentification } from '../utils/request-identification';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('JwsSigner', () => {
    let privateKeyPem: string;
    let publicKeyPem: string;

    beforeAll(() => {
        const { privateKey, publicKey } = generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        privateKeyPem = privateKey as unknown as string;
        publicKeyPem = publicKey as unknown as string;
    });

    it('should produce a compact JWS with the exact 5-field RS256 header and no typ', async () => {
        const targetUrl = '/ecom/jws/payments/hpp/create_order_v1';
        const payloadJson = JSON.stringify({ coinAmount: 1000 });

        const token = await JwsSigner.sign({
            privateKeyPem,
            kid: 'kid-123',
            targetUrl,
            payloadJson,
        });

        expect(token.split('.')).toHaveLength(3);

        const header = decodeProtectedHeader(token);
        expect(header).toEqual({
            alg: 'RS256',
            ts: expect.any(String),
            targetUrl,
            kid: 'kid-123',
            jti: expect.stringMatching(UUID_REGEX),
        });
        expect(Number(header.ts)).toBeCloseTo(Date.now(), -3);
    });

    it('should generate the jti via GenerateRequestIdentification.generateRequestId()', async () => {
        const spy = vi.spyOn(GenerateRequestIdentification, 'generateRequestId')
            .mockReturnValue('11111111-1111-1111-1111-111111111111');

        const token = await JwsSigner.sign({
            privateKeyPem,
            kid: 'kid-123',
            targetUrl: '/x',
            payloadJson: '{}',
        });

        expect(spy).toHaveBeenCalledTimes(1);
        expect(decodeProtectedHeader(token).jti).toBe('11111111-1111-1111-1111-111111111111');

        spy.mockRestore();
    });

    it('should produce a fresh unique jti on every call', async () => {
        const tokenA = await JwsSigner.sign({ privateKeyPem, kid: 'kid-1', targetUrl: '/x', payloadJson: '{}' });
        const tokenB = await JwsSigner.sign({ privateKeyPem, kid: 'kid-1', targetUrl: '/x', payloadJson: '{}' });

        expect(decodeProtectedHeader(tokenA).jti).not.toBe(decodeProtectedHeader(tokenB).jti);
    });

    it('should produce a signature verifiable with the matching public key', async () => {
        const payloadJson = JSON.stringify({ hello: 'world' });

        const token = await JwsSigner.sign({
            privateKeyPem,
            kid: 'kid-abc',
            targetUrl: '/ecom/jws/payments/refund_v1',
            payloadJson,
        });

        const publicKey = await importSPKI(publicKeyPem, 'RS256');
        const { payload } = await compactVerify(token, publicKey);

        expect(JSON.parse(new TextDecoder().decode(payload))).toEqual({ hello: 'world' });
    });

    it('should throw JwsSigningException when the private key PEM is empty', async () => {
        await expect(JwsSigner.sign({
            privateKeyPem: '',
            kid: 'kid-1',
            targetUrl: '/x',
            payloadJson: '{}',
        })).rejects.toThrow(JwsSigningException);
    });

    it('should throw JwsSigningException when the kid is empty', async () => {
        await expect(JwsSigner.sign({
            privateKeyPem,
            kid: '',
            targetUrl: '/x',
            payloadJson: '{}',
        })).rejects.toThrow(JwsSigningException);
    });

    it('should throw JwsSigningException when the payload is not valid JSON', async () => {
        await expect(JwsSigner.sign({
            privateKeyPem,
            kid: 'kid-1',
            targetUrl: '/x',
            payloadJson: 'not-json',
        })).rejects.toThrow(JwsSigningException);
    });

    it('should throw JwsSigningException when the key is not a valid PEM', async () => {
        await expect(JwsSigner.sign({
            privateKeyPem: '-----BEGIN PRIVATE KEY-----\nnot-a-real-key\n-----END PRIVATE KEY-----',
            kid: 'kid-1',
            targetUrl: '/x',
            payloadJson: '{}',
        })).rejects.toThrow(JwsSigningException);
    });

    describe('ES256 (EC P-256 keys)', () => {
        let ecPrivatePem: string;
        let ecPublicPem: string;

        beforeAll(() => {
            const { privateKey, publicKey } = generateKeyPairSync('ec', {
                namedCurve: 'prime256v1',
                publicKeyEncoding: { type: 'spki', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
            });
            ecPrivatePem = privateKey as unknown as string;
            ecPublicPem = publicKey as unknown as string;
        });

        it('should use ES256 with the same 5-field header for an EC P-256 key', async () => {
            const token = await JwsSigner.sign({
                privateKeyPem: ecPrivatePem, kid: 'kid-ec', targetUrl: '/x', payloadJson: '{}',
            });

            expect(decodeProtectedHeader(token)).toEqual({
                alg: 'ES256',
                ts: expect.any(String),
                targetUrl: '/x',
                kid: 'kid-ec',
                jti: expect.stringMatching(UUID_REGEX),
            });
        });

        it('should produce a raw R||S signature (64 bytes) verifiable with the public key', async () => {
            const token = await JwsSigner.sign({
                privateKeyPem: ecPrivatePem, kid: 'kid-ec', targetUrl: '/x', payloadJson: '{"a":1}',
            });

            const signature = Buffer.from(token.split('.')[2], 'base64url');
            expect(signature).toHaveLength(64);

            const publicKey = await importSPKI(ecPublicPem, 'ES256');
            const { payload } = await compactVerify(token, publicKey);
            expect(JSON.parse(new TextDecoder().decode(payload))).toEqual({ a: 1 });
        });

        it('should keep RS256 for RSA keys', async () => {
            const token = await JwsSigner.sign({
                privateKeyPem, kid: 'kid-rsa', targetUrl: '/x', payloadJson: '{}',
            });
            expect(decodeProtectedHeader(token).alg).toBe('RS256');
        });

        it('should reject an EC key on another curve with a clear error code', async () => {
            const { privateKey } = generateKeyPairSync('ec', {
                namedCurve: 'secp384r1',
                publicKeyEncoding: { type: 'spki', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
            });

            await expect(JwsSigner.sign({
                privateKeyPem: privateKey as unknown as string, kid: 'k', targetUrl: '/x', payloadJson: '{}',
            })).rejects.toMatchObject({ code: 'JWS_PRIVATE_KEY_UNSUPPORTED_CURVE' });
        });

        it('should reject unsupported key types (ed25519)', async () => {
            const { privateKey } = generateKeyPairSync('ed25519', {
                publicKeyEncoding: { type: 'spki', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
            });

            await expect(JwsSigner.sign({
                privateKeyPem: privateKey as unknown as string, kid: 'k', targetUrl: '/x', payloadJson: '{}',
            })).rejects.toMatchObject({ code: 'JWS_PRIVATE_KEY_UNSUPPORTED_TYPE' });
        });
    });

    describe('PEM normalization (keys that lost their line breaks)', () => {
        const ecKeys = generateKeyPairSync('ec', {
            namedCurve: 'prime256v1',
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        const ecPem = ecKeys.privateKey as unknown as string;
        const ecPub = ecKeys.publicKey as unknown as string;
        const bodyOf = (pem: string) => pem.replace(/-----[A-Z ]+-----|\s/g, '');

        const variants: Record<string, (pem: string) => string> = {
            'single line': (pem) => `-----BEGIN PRIVATE KEY-----${bodyOf(pem)}-----END PRIVATE KEY-----`,
            'literal \\n': (pem) => pem.trim().replace(/\n/g, '\\n'),
            'CRLF': (pem) => pem.replace(/\n/g, '\r\n'),
            'quoted with whitespace': (pem) => `  "${pem.trim().replace(/\n/g, '\\n')}"  `,
            'spaces instead of newlines': (pem) => pem.trim().replace(/\n/g, ' '),
        };

        it.each(Object.keys(variants))('should sign with an EC key given as: %s', async (name) => {
            const token = await JwsSigner.sign({
                privateKeyPem: variants[name](ecPem), kid: 'k', targetUrl: '/x', payloadJson: '{"a":1}',
            });

            expect(decodeProtectedHeader(token).alg).toBe('ES256');
            const { payload } = await compactVerify(token, await importSPKI(ecPub, 'ES256'));
            expect(JSON.parse(new TextDecoder().decode(payload))).toEqual({ a: 1 });
        });

        it('should sign with a single-line RSA key using RS256', async () => {
            const token = await JwsSigner.sign({
                privateKeyPem: `-----BEGIN PRIVATE KEY-----${bodyOf(privateKeyPem)}-----END PRIVATE KEY-----`,
                kid: 'k', targetUrl: '/x', payloadJson: '{}',
            });
            expect(decodeProtectedHeader(token).alg).toBe('RS256');
        });

        it('should leave an already valid PEM semantically unchanged', () => {
            expect(bodyOf(normalizePrivateKeyPem(ecPem))).toBe(bodyOf(ecPem));
            expect(normalizePrivateKeyPem(ecPem)).toMatch(/^-----BEGIN PRIVATE KEY-----\n[\s\S]+\n-----END PRIVATE KEY-----\n$/);
        });

        it('should return input without a PEM block or with an empty body unchanged', () => {
            expect(normalizePrivateKeyPem('not a key')).toBe('not a key');
            expect(normalizePrivateKeyPem('-----BEGIN PRIVATE KEY----------END PRIVATE KEY-----'))
                .toBe('-----BEGIN PRIVATE KEY----------END PRIVATE KEY-----');
        });

        it('should still reject garbage between valid headers with JWS_PRIVATE_KEY_INVALID', async () => {
            await expect(JwsSigner.sign({
                privateKeyPem: '-----BEGIN PRIVATE KEY-----bm90IGEga2V5-----END PRIVATE KEY-----',
                kid: 'k', targetUrl: '/x', payloadJson: '{}',
            })).rejects.toMatchObject({ code: 'JWS_PRIVATE_KEY_INVALID' });
        });
    });
});

