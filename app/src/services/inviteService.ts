import { supabase } from '../lib/supabase';

function generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export const createFamilyInvite = async (familyId: string, createdBy: string): Promise<string> => {
    const code = generateInviteCode();
    const { error } = await supabase.from('invites').insert({
        code,
        family_id: familyId,
        created_by: createdBy,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    if (error) throw error;
    return code;
};

export const lookupInviteCode = async (code: string): Promise<{ familyId: string; familyName: string; inviteId: string } | null> => {
    const { data: invites } = await supabase
        .from('invites')
        .select('id, family_id, expires_at, families(name)')
        .eq('code', code.toUpperCase())
        .eq('used', false)
        .limit(1);

    if (!invites?.length) return null;

    const invite = invites[0];
    if (new Date(invite.expires_at) < new Date()) return null;

    const familyName = (invite as any).families?.name || 'Unknown Family';

    return { familyId: invite.family_id, familyName, inviteId: invite.id };
};

export const markInviteUsed = async (inviteId: string): Promise<void> => {
    await supabase.from('invites').update({ used: true }).eq('id', inviteId);
};
