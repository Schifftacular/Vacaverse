export type TripAccessResult = 'has-access' | 'denied' | 'not-found';

interface TripRow {
    id: string;
    user_id: string;
    family_id: string | null;
}

// Client-side mirror of the server's (absent) row-level access check — the
// server has no auth-scoped SELECT, so "does this user have access to this
// trip" is decided here from the raw row plus the user's known families and
// (since email invites can grant access to a single trip independent of any
// family) their own trip_members rows.
export function classifyTripAccess(
    row: TripRow | null,
    userId: string,
    memberFamilyIds: string[],
    memberTripIds: string[] = []
): TripAccessResult {
    if (!row) return 'not-found';
    if (row.user_id === userId) return 'has-access';
    if (row.family_id && memberFamilyIds.includes(row.family_id)) return 'has-access';
    if (memberTripIds.includes(row.id)) return 'has-access';
    return 'denied';
}

// Access model (see issue #3): a trip belongs to exactly one family. With
// exactly one family there's nothing to decide, so attach silently. With
// more than one, the creator must pick — `selectedFamilyId` is whatever
// they've chosen in the UI so far (null until they do). With none, the trip
// stays unattached until a family exists to attach it to (see issue #6).
export function resolveTripFamilyId(
    families: { id: string }[],
    selectedFamilyId: string | null
): string | null {
    if (families.length === 1) return families[0].id;
    if (families.length > 1) return selectedFamilyId;
    return null;
}
