import { useState } from 'react';
import { useLocation, useNavigate, type Location } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button, Panel } from '../components/ui/Concourse';

// Home/Family/Trips redirect here (via ProtectedRoute) instead of silently
// bouncing signed-out taps back to /profile with no explanation — the
// destination's label gives that explanation.
const ENTRY_LABELS: Record<string, string> = {
    '/': 'to see your trips',
    '/family': 'to view your family',
    '/trips': 'to plan a trip',
    '/profile': 'to view your profile',
};

function entryReason(from?: Location) {
    if (!from) return null;
    return ENTRY_LABELS[from.pathname] ?? null;
}

export default function Login() {
    const { signInWithEmail, signUpWithEmail } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: Location } | null)?.from;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            if (isSignUp) {
                await signUpWithEmail(email, password, displayName);
            } else {
                await signInWithEmail(email, password);
            }
            navigate(from?.pathname ?? '/', { replace: true });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to authenticate');
        } finally {
            setSubmitting(false);
        }
    };

    const reason = entryReason(from);

    return (
        <div className="flex flex-col items-center justify-center min-h-[85vh] p-4">
            {/* The sign-in ticket — a raked glass slide, like a boarding pass
                lit on the board, rather than a generic centered form stack. */}
            <div className="w-full max-w-xs relative">
                <Panel raked className="p-6 pt-8 relative overflow-visible">
                    <span className="cx-label absolute top-4 right-4 text-[10px] text-[var(--color-text-muted)]">VacaVerse</span>
                    <div className="w-14 h-14 bg-brand-teal/15 border border-brand-teal/30 rounded-full flex items-center justify-center mb-5 text-brand-teal">
                        <LogIn size={26} />
                    </div>
                    <h2 className="cx-h1 text-2xl text-[var(--color-text-primary)] mb-2">{isSignUp ? 'Create Account' : 'Sign In'}</h2>
                    <p className="text-[var(--color-text-secondary)] mb-6 text-sm">
                        {reason ? `Sign in ${reason}.` : 'Manage your trips, collaborate with family, and save your preferences.'}
                    </p>

                    <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
                        {error && (
                            <div className="bg-[var(--color-vermilion)]/15 text-[var(--color-vermilion)] border border-[var(--color-vermilion)]/30 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}
                        {isSignUp && (
                            <input
                                type="text"
                                placeholder="Your name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="p-3 rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:outline-none focus:border-brand-teal"
                                required
                            />
                        )}
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="p-3 rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:outline-none focus:border-brand-teal"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="p-3 rounded-lg bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border)] focus:outline-none focus:border-brand-teal"
                            required
                        />
                        <Button type="submit" variant="primary" size="lg" disabled={submitting}>
                            {isSignUp ? 'Sign Up' : 'Sign In'}
                        </Button>
                    </form>
                </Panel>
                {/* The stub — torn-ticket companion tab holding the mode switch */}
                <div className="cx-slide mt-2 py-3 text-center">
                    <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-[var(--color-text-secondary)] text-sm hover:text-brand-teal transition-colors"
                    >
                        {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                    </button>
                </div>
            </div>
        </div>
    );
}
