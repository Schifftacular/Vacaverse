export interface MemberRelation {
    user_id: string;
    parent_id: string | null;
    partner_id: string | null;
}

export interface TreeUnit {
    personId: string;
    partnerId: string | null;
}

// Oldest generation first (index 0), youngest last.
export type TreeGenerations = TreeUnit[][];

// Builds a rendering-ready generation list from flat parent_id/partner_id
// data (see issue #11). A person's generation is how many parent_id hops
// separate them from their nearest ancestor with no known parent in this
// family — a dangling parent_id (parent not a member here) is treated the
// same as no parent at all, i.e. a root. Mutual, or even one-directional,
// partner_id pairs collapse into a single two-person unit so couples render
// side by side instead of as two separate branches.
export function buildFamilyTree(members: MemberRelation[]): TreeGenerations {
    if (!members.length) return [];

    const byId = new Map(members.map(m => [m.user_id, m]));
    const depthCache = new Map<string, number>();

    function depthOf(id: string): number {
        const path: string[] = [];
        const seen = new Set<string>();
        let current = id;

        while (true) {
            if (depthCache.has(current)) {
                let d = depthCache.get(current)! + 1;
                for (let i = path.length - 1; i >= 0; i--) {
                    depthCache.set(path[i], d);
                    d++;
                }
                return depthCache.get(id)!;
            }
            if (seen.has(current)) {
                // A cycle in parent_id references — there's no meaningful
                // ordering for it, so treat everyone in the loop as a root
                // rather than recursing forever.
                for (const p of path) depthCache.set(p, 0);
                return depthCache.get(id)!;
            }
            seen.add(current);
            path.push(current);

            const member = byId.get(current);
            const parentId = member?.parent_id;
            if (!parentId || !byId.has(parentId)) {
                let d = 0;
                for (let i = path.length - 1; i >= 0; i--) {
                    depthCache.set(path[i], d);
                    d++;
                }
                return depthCache.get(id)!;
            }
            current = parentId;
        }
    }

    const consumed = new Set<string>();
    const unitsByDepth = new Map<number, TreeUnit[]>();

    for (const member of members) {
        if (consumed.has(member.user_id)) continue;

        let partnerId: string | null = null;
        if (member.partner_id && byId.has(member.partner_id) && !consumed.has(member.partner_id)) {
            partnerId = member.partner_id;
        } else {
            const reverse = members.find(
                m => m.user_id !== member.user_id && m.partner_id === member.user_id && !consumed.has(m.user_id)
            );
            if (reverse) partnerId = reverse.user_id;
        }

        consumed.add(member.user_id);
        if (partnerId) consumed.add(partnerId);

        const depth = depthOf(member.user_id);
        const unit: TreeUnit = { personId: member.user_id, partnerId };
        if (!unitsByDepth.has(depth)) unitsByDepth.set(depth, []);
        unitsByDepth.get(depth)!.push(unit);
    }

    return Array.from(unitsByDepth.keys())
        .sort((a, b) => a - b)
        .map(d => unitsByDepth.get(d)!);
}

// Would setting personId's parent to candidateParentId make personId their
// own ancestor? Walks candidateParentId's existing chain looking for
// personId, capped at the family size so a pre-existing cycle elsewhere in
// the data can't hang this check either.
export function wouldCreateCycle(
    members: MemberRelation[],
    personId: string,
    candidateParentId: string
): boolean {
    if (personId === candidateParentId) return true;

    const byId = new Map(members.map(m => [m.user_id, m]));
    let current: string | null = candidateParentId;
    let steps = 0;

    while (current && steps <= members.length) {
        if (current === personId) return true;
        current = byId.get(current)?.parent_id ?? null;
        steps++;
    }
    return false;
}
