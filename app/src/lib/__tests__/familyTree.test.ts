import { describe, expect, it } from 'vitest';
import { buildFamilyTree, wouldCreateCycle } from '../familyTree';

describe('buildFamilyTree', () => {
    it('returns no generations for an empty family', () => {
        expect(buildFamilyTree([])).toEqual([]);
    });

    it('puts a single member with no relations in one generation', () => {
        const tree = buildFamilyTree([{ user_id: 'a', parent_id: null, partner_id: null }]);
        expect(tree).toEqual([[{ personId: 'a', partnerId: null }]]);
    });

    it('puts a parent and child in separate generations, oldest first', () => {
        const tree = buildFamilyTree([
            { user_id: 'parent', parent_id: null, partner_id: null },
            { user_id: 'child', parent_id: 'parent', partner_id: null },
        ]);
        expect(tree).toEqual([
            [{ personId: 'parent', partnerId: null }],
            [{ personId: 'child', partnerId: null }],
        ]);
    });

    it('groups mutual partners into a single unit instead of two', () => {
        const tree = buildFamilyTree([
            { user_id: 'a', parent_id: null, partner_id: 'b' },
            { user_id: 'b', parent_id: null, partner_id: 'a' },
        ]);
        expect(tree).toEqual([[{ personId: 'a', partnerId: 'b' }]]);
    });

    it('pairs a one-directional partner_id the same as a mutual one', () => {
        const tree = buildFamilyTree([
            { user_id: 'a', parent_id: null, partner_id: 'b' },
            { user_id: 'b', parent_id: null, partner_id: null },
        ]);
        expect(tree).toEqual([[{ personId: 'a', partnerId: 'b' }]]);
    });

    it('places a couple with mismatched depths at the deeper partner\'s generation', () => {
        // A married in (root), B is a blood grandchild of some third root C.
        const tree = buildFamilyTree([
            { user_id: 'c', parent_id: null, partner_id: null },
            { user_id: 'mid', parent_id: 'c', partner_id: null },
            { user_id: 'b', parent_id: 'mid', partner_id: 'a' },
            { user_id: 'a', parent_id: null, partner_id: 'b' },
        ]);
        expect(tree).toEqual([
            [{ personId: 'c', partnerId: null }],
            [{ personId: 'mid', partnerId: null }],
            [{ personId: 'b', partnerId: 'a' }],
        ]);
    });

    it('treats a dangling parent_id (parent not in this family) as a root', () => {
        const tree = buildFamilyTree([
            { user_id: 'a', parent_id: 'nobody-in-this-family', partner_id: null },
        ]);
        expect(tree).toEqual([[{ personId: 'a', partnerId: null }]]);
    });

    it('does not infinite-loop on a parent_id cycle, and treats the cycle as roots', () => {
        const tree = buildFamilyTree([
            { user_id: 'a', parent_id: 'b', partner_id: null },
            { user_id: 'b', parent_id: 'a', partner_id: null },
        ]);
        expect(tree.flat().map(u => u.personId).sort()).toEqual(['a', 'b']);
        expect(tree.length).toBe(1);
    });

    it('builds three generations: grandparent couple, parent, child', () => {
        const tree = buildFamilyTree([
            { user_id: 'gpa', parent_id: null, partner_id: 'gma' },
            { user_id: 'gma', parent_id: null, partner_id: 'gpa' },
            { user_id: 'dad', parent_id: 'gpa', partner_id: null },
            { user_id: 'kid', parent_id: 'dad', partner_id: null },
        ]);
        expect(tree).toEqual([
            [{ personId: 'gpa', partnerId: 'gma' }],
            [{ personId: 'dad', partnerId: null }],
            [{ personId: 'kid', partnerId: null }],
        ]);
    });

    it('keeps two unrelated members in the same root generation', () => {
        const tree = buildFamilyTree([
            { user_id: 'a', parent_id: null, partner_id: null },
            { user_id: 'b', parent_id: null, partner_id: null },
        ]);
        expect(tree).toEqual([[{ personId: 'a', partnerId: null }, { personId: 'b', partnerId: null }]]);
    });
});

describe('wouldCreateCycle', () => {
    const members = [
        { user_id: 'gpa', parent_id: null, partner_id: null },
        { user_id: 'dad', parent_id: 'gpa', partner_id: null },
        { user_id: 'kid', parent_id: 'dad', partner_id: null },
    ];

    it('rejects making someone their own parent', () => {
        expect(wouldCreateCycle(members, 'dad', 'dad')).toBe(true);
    });

    it('rejects making a descendant your parent', () => {
        expect(wouldCreateCycle(members, 'gpa', 'kid')).toBe(true);
    });

    it('allows a legitimate, non-cyclic assignment', () => {
        expect(wouldCreateCycle(members, 'kid', 'gpa')).toBe(false);
    });

    it('allows assigning an unrelated person as parent', () => {
        const withUnrelated = [...members, { user_id: 'other', parent_id: null, partner_id: null }];
        expect(wouldCreateCycle(withUnrelated, 'other', 'dad')).toBe(false);
    });
});
