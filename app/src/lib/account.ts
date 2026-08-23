const NEW_ACCOUNT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// "Welcome back, {name}" on a brand-new user's very first Home visit reads
// as broken — there's nothing to come back to yet. Treat an account created
// within the last few minutes as new instead of returning.
export function isNewAccount(createdAt: string, now: Date): boolean {
    const created = new Date(createdAt).getTime();
    if (Number.isNaN(created)) return false;
    return now.getTime() - created < NEW_ACCOUNT_WINDOW_MS;
}
