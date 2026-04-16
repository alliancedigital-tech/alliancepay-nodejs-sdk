import { describe, it, expect, beforeEach } from 'vitest';
import { EncryptionService } from './encryption';
import { generateKeyPair, exportJWK } from 'jose';

describe('EncryptionService', () => {
    let service: EncryptionService;
    let publicKeyJWK: string;
    let privateKeyJWK: string;

    beforeEach(async () => {
        service = new EncryptionService();

        const { publicKey, privateKey } = await generateKeyPair('ECDH-ES+A256KW', {
            extractable: true
        });

        publicKeyJWK = JSON.stringify(await exportJWK(publicKey));
        privateKeyJWK = JSON.stringify(await exportJWK(privateKey));
    });

    it('should correctly encrypt and decrypt a payload', async () => {
        const payload = {
            orderId: '12345',
            amount: 1000,
            currency: 'UAH'
        };

        const jwe = await service.encrypt(payload, publicKeyJWK);
        expect(typeof jwe).toBe('string');
        expect(jwe.split('.').length).toBe(5);

        const decrypted = await service.decrypt<typeof payload>(jwe, privateKeyJWK);

        expect(decrypted).toEqual(payload);
        expect(decrypted.orderId).toBe('12345');
    });

    it('should work when keys are passed as objects instead of JSON strings', async () => {
        const payload = { secret: 'data' };
        const publicKeyObj = JSON.parse(publicKeyJWK);
        const privateKeyObj = JSON.parse(privateKeyJWK);

        const jwe = await service.encrypt(payload, publicKeyObj as any);
        const decrypted = await service.decrypt(jwe, privateKeyObj);

        expect(decrypted).toEqual(payload);
    });

    it('should throw an error if decryption fails with wrong key', async () => {
        const payload = { data: 'test' };
        const jwe = await service.encrypt(payload, publicKeyJWK);

        const anotherPair = await generateKeyPair('ECDH-ES+A256KW', {
            extractable: true
        });
        const wrongPrivateKey = JSON.stringify(await exportJWK(anotherPair.privateKey));

        await expect(service.decrypt(jwe, wrongPrivateKey))
            .rejects.toThrow();
    });

    it('should throw an error if key JSON is invalid', async () => {
        const payload = { data: 'test' };
        const invalidKey = '{ "invalid": "json" ';

        await expect(service.encrypt(payload, invalidKey))
            .rejects.toThrow(SyntaxError);
    });

    it('should fail if the JWE token is tampered with', async () => {
        const payload = { data: 'secure' };
        let jwe = await service.encrypt(payload, publicKeyJWK);

        const tamperedJwe = jwe.substring(0, jwe.length - 5) + 'XXXXX';

        await expect(service.decrypt(tamperedJwe, privateKeyJWK))
            .rejects.toThrow();
    });
});
