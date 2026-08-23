import { describe, expect, it } from 'vitest';
import { formatEventTime } from '../time';

describe('formatEventTime', () => {
    it('formats a morning 24h time as 12h with AM', () => {
        expect(formatEventTime('09:05')).toBe('9:05 AM');
    });

    it('formats noon as 12 PM', () => {
        expect(formatEventTime('12:00')).toBe('12:00 PM');
    });

    it('formats midnight as 12 AM', () => {
        expect(formatEventTime('00:00')).toBe('12:00 AM');
    });

    it('formats an evening 24h time as 12h with PM', () => {
        expect(formatEventTime('18:00')).toBe('6:00 PM');
    });

    it('returns the input unchanged when it is not HH:mm', () => {
        expect(formatEventTime('')).toBe('');
        expect(formatEventTime('not-a-time')).toBe('not-a-time');
    });
});
