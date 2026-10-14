import { describe, it, expect, beforeAll, vi } from 'vitest';
import { generateKeyPairSync } from 'node:crypto';
import { decodeProtectedHeader, compactVerify, importSPKI } from 'jose';
import { JwsSigner } from './jws-signer';
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
});
