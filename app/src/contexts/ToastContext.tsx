import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto remove
        setTimeout(() => {
            removeToast(id);
        }, 5000);
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* bottom-40 clears both the BottomNav (h-16 + safe-area) and the
                bottom-20/24 FABs used across trip surfaces, so a toast never
                collides with either. */}
            <div className="fixed bottom-40 right-4 z-[9999] flex flex-col gap-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
                            cx-slide flex items-center gap-3 px-4 py-3 min-w-[300px] animate-in slide-in-from-right-full
                            ${toast.type === 'success' ? 'text-[var(--color-bottle-green)]' : ''}
                            ${toast.type === 'error' ? 'text-[var(--color-vermilion)]' : ''}
                            ${toast.type === 'info' ? 'text-brand-teal' : ''}
                        `}
                    >
                        {toast.type === 'success' && <CheckCircle size={20} />}
                        {toast.type === 'error' && <AlertCircle size={20} />}
                        {toast.type === 'info' && <Info size={20} />}

                        <p className="text-sm font-medium flex-1 text-[var(--color-text-primary)]">{toast.message}</p>

                        <button onClick={() => removeToast(toast.id)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
