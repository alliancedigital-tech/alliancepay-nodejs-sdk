import { describe, it, expect } from 'vitest';
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
