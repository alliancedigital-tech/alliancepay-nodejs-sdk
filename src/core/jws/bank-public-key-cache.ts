export interface BankPublicKeyJwk {
    kty: string;
    crv: string;
    x: string;
    y: string;
    kid: string;
    alg?: string;
}

interface CacheEntry {
    jwk: BankPublicKeyJwk;
    expiresAt: number;
}

export class BankPublicKeyCache {
    private readonly ttlMs = 3_600_000;
    private readonly store = new Map<string, CacheEntry>();

    public get(kid: string): BankPublicKeyJwk | undefined {
        const entry = this.store.get(kid);
        if (!entry) return undefined;

        if (Date.now() > entry.expiresAt) {
            this.store.delete(kid);
            return undefined;
        }

        return entry.jwk;
    }

    public set(kid: string, jwk: BankPublicKeyJwk): void {
        this.store.set(kid, { jwk, expiresAt: Date.now() + this.ttlMs });
    }

    public clear(): void {
        this.store.clear();
    }
}

export const bankPublicKeyCache = new BankPublicKeyCache();
