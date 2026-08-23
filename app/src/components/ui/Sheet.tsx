import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from './cn';
import { springSheet } from '../../lib/motion';

interface SheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: ReactNode;
    title?: string;
    /** 'responsive' = bottom sheet on mobile, centered dialog at sm:+ (default).
     *  'bottom' = always bottom-anchored (e.g. confirm-delete). */
    variant?: 'responsive' | 'bottom';
    className?: string;
}

// Portal-based so it can never end up a descendant of a transformed
// motion.div ancestor — layout shells stay transform-free at that level
// deliberately (see BottomNav/FeedbackWidget fixed-positioning notes).
export function Sheet({ open, onOpenChange, children, title, variant = 'responsive', className }: SheetProps) {
    const panelRef = useRef<HTMLDivElement>(null);
    const previouslyFocused = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!open) return;

        previouslyFocused.current = document.activeElement as HTMLElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onOpenChange(false);
                return;
            }
            if (e.key !== 'Tab') return;
            const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (!focusable || focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        panelRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea')?.focus();

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
            previouslyFocused.current?.focus();
        };
    }, [open, onOpenChange]);

    const panelPosition = variant === 'bottom'
        ? 'items-end'
        : 'items-end sm:items-center';

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className={cn('fixed inset-0 z-[999] flex justify-center', panelPosition)}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => onOpenChange(false)}
                        className="absolute inset-0 bg-[var(--color-carbon)]/50 backdrop-blur-sm"
                    />
                    <motion.div
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label={title}
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={springSheet}
                        className={cn(
                            'cx-slide relative w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-b-none sm:rounded-b-[14px] p-6',
                            className
                        )}
                    >
                        {title && (
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="cx-h2 text-[var(--color-text-primary)]">{title}</h2>
                                <button
                                    onClick={() => onOpenChange(false)}
                                    aria-label="Close"
                                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        )}
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
