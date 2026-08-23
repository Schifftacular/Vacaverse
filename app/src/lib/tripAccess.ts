export type TripAccessResult = 'has-access' | 'denied' | 'not-found';

interface TripRow {
    user_id: string;
    family_id: string | null;
}

// Client-side mirror of the server's (absent) row-level access check — the
// server has no auth-scoped SELECT, so "does this user have access to this
// trip" is decided here from the raw row plus the user's known families.
export function classifyTripAccess(
    row: TripRow | null,
    userId: string,
    memberFamilyIds: string[]
): TripAccessResult {
    if (!row) return 'not-found';
    if (row.user_id === userId) return 'has-access';
    if (row.family_id && memberFamilyIds.includes(row.family_id)) return 'has-access';
    return 'denied';
}
