import { describe, it, expect, vi, afterEach } from 'vitest';
import { DateTimeProvider } from './date-time.provider';

describe('DateTimeProvider', () => {
    it('should format a given date correctly for refund requests', () => {
        const date = new Date('2026-03-19T17:25:00.567Z');
        const formatted = DateTimeProvider.formattedRefundDate(date);

        expect(formatted).toBe('2026-03-19 17:25:00.56+00:00');
    });

    it('should use current date if no date is provided', () => {
        const formatted = DateTimeProvider.formattedRefundDate();

        const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{2}\+00:00$/;
        expect(formatted).toMatch(regex);
    });

    it('should truncate 3-digit milliseconds to 2 digits', () => {
        const date = new Date('2026-01-01T12:00:00.999Z');
        const formatted = DateTimeProvider.formattedRefundDate(date);

        expect(formatted).toContain('.99+00:00');
    });
});

describe('DateTimeProvider.formattedPreAuthExpDate', () => {
    const FORMAT_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{2}\+00:00$/;
    const TWO_HOURS_MS   = 2 * 60 * 60 * 1000;
    const THIRTY_SECS_MS = 30 * 1000;

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should return a string in the correct format', () => {
        const result = DateTimeProvider.formattedPreAuthExpDate();
        expect(result).toMatch(FORMAT_REGEX);
    });

    it('should return a date approximately now + 2h + 30s', () => {
        const fixedNow = new Date('2026-06-01T10:00:00.000Z').getTime();
        vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

        const result = DateTimeProvider.formattedPreAuthExpDate();

        const expectedDate = new Date(fixedNow + TWO_HOURS_MS + THIRTY_SECS_MS);
        const expected = DateTimeProvider.formattedRefundDate(expectedDate);

        expect(result).toBe(expected);
    });

    it('should be strictly greater than now + 2h', () => {
        const fixedNow = new Date('2026-06-01T10:00:00.000Z').getTime();
        vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

        const result = DateTimeProvider.formattedPreAuthExpDate();
        const resultDate = new Date(result.replace(' ', 'T').replace(/(\+\d{2}:\d{2})$/, 'Z'));
        const minDate = new Date(fixedNow + TWO_HOURS_MS);

        expect(resultDate.getTime()).toBeGreaterThan(minDate.getTime());
    });

    it('should be well within 28 days from now', () => {
        const fixedNow = new Date('2026-06-01T10:00:00.000Z').getTime();
        vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

        const result = DateTimeProvider.formattedPreAuthExpDate();
        const resultDate = new Date(result.replace(' ', 'T').replace(/(\+\d{2}:\d{2})$/, 'Z'));
        const maxDate = new Date(fixedNow + 28 * 24 * 60 * 60 * 1000);

        expect(resultDate.getTime()).toBeLessThan(maxDate.getTime());
    });

    it('should include the 30-second buffer beyond 2h', () => {
        const fixedNow = new Date('2026-06-01T10:00:00.000Z').getTime();
        vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

        const result = DateTimeProvider.formattedPreAuthExpDate();
        const resultDate = new Date(result.replace(' ', 'T').replace(/(\+\d{2}:\d{2})$/, 'Z'));
        const exactTwoHours = new Date(fixedNow + TWO_HOURS_MS);

        expect(resultDate.getTime()).toBeGreaterThanOrEqual(
            exactTwoHours.getTime() + THIRTY_SECS_MS - 1000 // -1s tolerance for ms truncation
        );
    });
});
