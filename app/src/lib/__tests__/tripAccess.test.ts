import { describe, expect, it } from 'vitest';
import { classifyTripAccess } from '../tripAccess';

describe('classifyTripAccess', () => {
    it('reports not-found when no trip row exists', () => {
        expect(classifyTripAccess(null, 'user-1', [])).toBe('not-found');
    });

    it('reports has-access when the user owns the trip', () => {
        const row = { id: 't1', user_id: 'user-1', family_id: null };
        expect(classifyTripAccess(row, 'user-1', [])).toBe('has-access');
    });

    it('reports has-access when the user belongs to the trip family', () => {
        const row = { id: 't1', user_id: 'someone-else', family_id: 'fam-1' };
        expect(classifyTripAccess(row, 'user-1', ['fam-1', 'fam-2'])).toBe('has-access');
    });

    it('reports denied when the trip exists but belongs to neither the user nor their families', () => {
        const row = { id: 't1', user_id: 'someone-else', family_id: 'fam-9' };
        expect(classifyTripAccess(row, 'user-1', ['fam-1', 'fam-2'])).toBe('denied');
    });

    it('reports denied for an unowned trip with no family attached', () => {
        const row = { id: 't1', user_id: 'someone-else', family_id: null };
        expect(classifyTripAccess(row, 'user-1', ['fam-1'])).toBe('denied');
    });
});
