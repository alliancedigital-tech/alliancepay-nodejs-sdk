import { describe, it, expect } from 'vitest';
import { shouldApplyFiscalizationUpdate } from './fiscalization-status';

const t1 = '2026-09-03T10:39:09.540+03:00';
const t2 = '2026-09-03T10:40:09.540+03:00';
const t1InUtc = '2026-09-03T07:39:09.540Z';

describe('shouldApplyFiscalizationUpdate', () => {
    it('applies when nothing is stored', () => {
        expect(shouldApplyFiscalizationUpdate(null, { status: 'PENDING' })).toBe(true);
    });
    it('never downgrades SUCCESS', () => {
        expect(shouldApplyFiscalizationUpdate({ status: 'SUCCESS' }, { status: 'PENDING' })).toBe(false);
        expect(shouldApplyFiscalizationUpdate({ status: 'SUCCESS' }, { status: 'FAIL' })).toBe(false);
    });
    it('never overwrites a final status with PENDING', () => {
        expect(shouldApplyFiscalizationUpdate({ status: 'FAIL' }, { status: 'PENDING' })).toBe(false);
    });
    it('moves PENDING to SUCCESS and FAIL', () => {
        expect(shouldApplyFiscalizationUpdate({ status: 'PENDING' }, { status: 'SUCCESS' })).toBe(true);
        expect(shouldApplyFiscalizationUpdate({ status: 'PENDING' }, { status: 'FAIL' })).toBe(true);
    });
    it('ignores stale data by modification time, honouring time zones', () => {
        const current = { status: 'PENDING', modificationDateTime: t2 };
        expect(shouldApplyFiscalizationUpdate(current, { status: 'PENDING', modificationDateTime: t1 })).toBe(false);
        expect(shouldApplyFiscalizationUpdate({ status: 'PENDING', modificationDateTime: t1 }, { status: 'PENDING', modificationDateTime: t1InUtc })).toBe(true);
    });
    it('prefers fiscalizationModificationDateTime and tolerates garbage dates', () => {
        const current = { status: 'PENDING', fiscalizationModificationDateTime: t2, modificationDateTime: t1 };
        expect(shouldApplyFiscalizationUpdate(current, { status: 'PENDING', fiscalizationModificationDateTime: t1 })).toBe(false);
        expect(shouldApplyFiscalizationUpdate({ status: 'PENDING', modificationDateTime: 'garbage' }, { status: 'PENDING', modificationDateTime: t1 })).toBe(true);
    });
    it('is idempotent for a repeated SUCCESS', () => {
        expect(shouldApplyFiscalizationUpdate({ status: 'SUCCESS', modificationDateTime: t1 }, { status: 'SUCCESS', modificationDateTime: t1 })).toBe(true);
    });
});
