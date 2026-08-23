import type { HTMLAttributes, ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { twMerge } from 'tailwind-merge';
import { springPress } from '../../lib/motion';

/**
 * Shared Concourse primitives — the departures-board design system.
 * Every page should reach for these instead of hand-rolling card/button
 * markup, so the raked-panel language stays consistent app-wide. Repainted
 * in VacaVerse's tropical brand (ocean/aqua/sun/cream) with spring-based
 * press feedback — see src/index.css's header comment.
 */

export function Button({
    variant = 'primary',
    size = 'md',
    className,
    ...props
}: HTMLMotionProps<'button'> & {
    variant?: 'primary' | 'ghost' | 'danger' | 'outline';
    size?: 'md' | 'lg' | 'icon';
}) {
    const base = 'cx-label inline-flex items-center justify-center gap-2 rounded-xl transition-colors disabled:opacity-50 disabled:pointer-events-none tracking-wide';
    const sizes = {
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3.5 text-base w-full',
        icon: 'w-11 h-11 shrink-0',
    };
    const variants = {
        primary: 'bg-brand-teal text-[var(--color-carbon)] hover:brightness-110',
        outline: 'border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-brand-teal',
        ghost: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
        danger: 'bg-[var(--color-vermilion)] text-white hover:brightness-110',
    };
    return (
        <motion.button
            whileTap={{ scale: 0.96 }}
            transition={springPress}
            className={twMerge(base, sizes[size], variants[variant], className)}
            {...props}
        />
    );
}

export function Panel({ raked = false, className, ...props }: HTMLAttributes<HTMLDivElement> & { raked?: boolean }) {
    return (
        <div className={twMerge('cx-slide', raked && 'cx-rake', className)} {...props} />
    );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={twMerge('cx-label text-xs text-[var(--color-text-muted)]', className)}>
            {children}
        </div>
    );
}

export function Tag({
    tone = 'neutral',
    children,
    className,
}: {
    tone?: 'neutral' | 'gold' | 'green' | 'vermilion';
    children: ReactNode;
    className?: string;
}) {
    const tones = {
        neutral: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
        gold: 'bg-brand-teal/15 text-brand-teal border-brand-teal/30',
        green: 'bg-[var(--color-bottle-green)]/15 text-[var(--color-bottle-green)] border-[var(--color-bottle-green)]/30',
        vermilion: 'bg-[var(--color-vermilion)]/15 text-[var(--color-vermilion)] border-[var(--color-vermilion)]/30',
    };
    return (
        <span className={twMerge('cx-label inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-md border', tones[tone], className)}>
            {children}
        </span>
    );
}

export function EmptyState({
    icon,
    title,
    hint,
    action,
}: {
    icon?: ReactNode;
    title: string;
    hint?: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center text-center gap-3 py-16 px-6">
            {icon && <div className="text-[var(--color-text-muted)]">{icon}</div>}
            <p className="font-semibold text-[var(--color-text-primary)]">{title}</p>
            {hint && <p className="text-sm text-[var(--color-text-secondary)] max-w-xs">{hint}</p>}
            {action}
        </div>
    );
}
