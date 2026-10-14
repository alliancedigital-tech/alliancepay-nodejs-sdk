import { describe, it, expect } from 'vitest';
import { isCompactJws } from './jws-format.util';

describe('isCompactJws', () => {
    it('should return true for a well-formed 3-part compact JWS', () => {
        expect(isCompactJws('aGVhZGVy.cGF5bG9hZA.c2ln')).toBe(true);
    });

    it('should return false for a plain JSON object string', () => {
        expect(isCompactJws('{"msgCode":"error"}')).toBe(false);
    });

    it('should return false for a string containing whitespace', () => {
        expect(isCompactJws('a.b. c')).toBe(false);
    });

    it('should return false for a 4-dot (JWE) string', () => {
        expect(isCompactJws('a.b.c.d.e')).toBe(false);
    });

    it('should return false for an empty string', () => {
        expect(isCompactJws('')).toBe(false);
    });

    it('should return false for a non-string value', () => {
        expect(isCompactJws({ a: 1 })).toBe(false);
        expect(isCompactJws(null)).toBe(false);
        expect(isCompactJws(undefined)).toBe(false);
    });
});
