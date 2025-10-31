import React from 'react';
import clsx from 'clsx';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';

export interface BadgeProps {
    readonly tone?: Tone;
    readonly children?: React.ReactNode;
    readonly className?: string;
}

const tones: Record<Tone, string> = {
    neutral:
        'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200',
    success:
        'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    warning:
        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    danger:
        'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    accent:
        'bg-red-600 text-white', // F1 rojo
};

export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', className, children }) => (
    <span
        className={clsx(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
            tones[tone],
            className
        )}
    >
        {children}
    </span>
);
