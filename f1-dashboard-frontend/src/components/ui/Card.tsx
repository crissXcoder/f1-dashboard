import React from 'react';
import clsx from 'clsx';

export interface CardProps {
    readonly className?: string;
    readonly children?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ className, children }) => (
    <div
        className={clsx(
            'rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900',
            className
        )}
    >
        {children}
    </div>
);

export const CardHeader: React.FC<CardProps> = ({ className, children }) => (
    <div
        className={clsx(
            'border-b border-neutral-200 px-4 py-3 dark:border-neutral-800',
            className
        )}
    >
        {children}
    </div>
);

export const CardTitle: React.FC<CardProps> = ({ className, children }) => (
    <h3
        className={clsx(
            'text-lg font-semibold text-neutral-900 dark:text-neutral-100',
            className
        )}
    >
        {children}
    </h3>
);

export const CardContent: React.FC<CardProps> = ({ className, children }) => (
    <div className={clsx('px-4 py-4', className)}>{children}</div>
);

export const CardFooter: React.FC<CardProps> = ({ className, children }) => (
    <div
        className={clsx(
            'border-t border-neutral-200 px-4 py-3 dark:border-neutral-800',
            className
        )}
    >
        {children}
    </div>
);
