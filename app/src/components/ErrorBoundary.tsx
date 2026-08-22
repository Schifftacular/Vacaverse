import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback?: React.ReactNode },
    ErrorBoundaryState
> {
    constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;
            return (
                <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
                    <AlertCircle size={48} className="text-[var(--color-vermilion)] mb-4" />
                    <h2 className="cx-h2 text-[var(--color-text-primary)] mb-2">Something went wrong</h2>
                    <p className="text-[var(--color-text-secondary)] mb-4">An unexpected error occurred.</p>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="px-6 py-3 bg-brand-teal text-[var(--color-carbon)] rounded-lg font-medium"
                    >
                        Try Again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
