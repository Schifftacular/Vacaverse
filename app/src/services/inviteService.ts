import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const INVITES_COLLECTION = 'invites';

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
    await addDoc(collection(db, INVITES_COLLECTION), {
        code,
        familyId,
        createdBy,
        createdAt: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        used: false,
    });
    return code;
};

export const lookupInviteCode = async (code: string): Promise<{ familyId: string; familyName: string } | null> => {
    const q = query(
        collection(db, INVITES_COLLECTION),
        where('code', '==', code.toUpperCase()),
        where('used', '==', false)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;

    const invite = snapshot.docs[0].data();
    if (invite.expiresAt < Date.now()) return null;

    // Get family name
    const familyDoc = await getDoc(doc(db, 'families', invite.familyId));
    if (!familyDoc.exists()) return null;

    return {
        familyId: invite.familyId,
        familyName: (familyDoc.data() as any).name,
    };
};
