import { describe, expect, it } from 'vitest';
import { isNewAccount } from '../account';

describe('isNewAccount', () => {
    it('treats an account created moments ago as new', () => {
        const now = new Date('2026-08-22T12:05:00.000Z');
        expect(isNewAccount('2026-08-22T12:00:00.000Z', now)).toBe(true);
    });

    it('treats an account created well in the past as returning', () => {
        const now = new Date('2026-08-22T12:05:00.000Z');
        expect(isNewAccount('2026-01-01T00:00:00.000Z', now)).toBe(false);
    });

    it('treats a missing/invalid created_at as returning, not new', () => {
        const now = new Date('2026-08-22T12:05:00.000Z');
        expect(isNewAccount('', now)).toBe(false);
        expect(isNewAccount('not-a-date', now)).toBe(false);
    });
});
