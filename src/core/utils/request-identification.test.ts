import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateRequestIdentification } from './request-identification';
import * as crypto from 'crypto';

vi.mock('crypto', () => ({
    randomUUID: vi.fn(() => '1234-uuid-mocked')
}));

describe('GenerateRequestIdentification', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return a non-empty string', () => {
        const id = GenerateRequestIdentification.generateRequestId();
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
    });

    it('should use crypto.randomUUID by default', () => {
        const id = GenerateRequestIdentification.generateRequestId();

        expect(id).toBe('1234-uuid-mocked');
        expect(crypto.randomUUID).toHaveBeenCalled();
    });
});
