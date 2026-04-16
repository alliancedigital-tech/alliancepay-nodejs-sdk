import {
    compactDecrypt,
    CompactEncrypt,
    importJWK
} from 'jose';

export interface JwePayload extends Record<string, any> {}

export class EncryptionService {
    private readonly alg = 'ECDH-ES+A256KW';
    private readonly enc = 'A256GCM';

    public async encrypt(payload: JwePayload, publicKey: string): Promise<string> {
        const key = typeof publicKey === 'string' ? await importJWK(JSON.parse(publicKey), this.alg) : publicKey;

        const data = new TextEncoder().encode(JSON.stringify(payload));

        return await new CompactEncrypt(data)
            .setProtectedHeader({ alg: this.alg, enc: this.enc })
            .encrypt(key);
    }

    public async decrypt<T = JwePayload>(token: string, privateKey: string | object): Promise<T> {
        const key = typeof privateKey === 'string'
            ? await importJWK(JSON.parse(privateKey), this.alg)
            : privateKey;

        const { plaintext } = await compactDecrypt(token, key, {
            keyManagementAlgorithms: [this.alg],
            contentEncryptionAlgorithms: [this.enc],
        });

        const decoded = new TextDecoder().decode(plaintext);
        return JSON.parse(decoded) as T;
    }
}
