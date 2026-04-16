import { randomUUID } from 'crypto';

export class GenerateRequestIdentification {
    public static generateRequestId(): string {
        return randomUUID();
    }
}
