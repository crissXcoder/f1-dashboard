import React from 'react';
import clsx from 'clsx';

export interface SpinnerProps {
    readonly size?: 'sm' | 'md' | 'lg';
    readonly className?: string;
}

const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
};

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => (
    <svg
        className={clsx('animate-spin text-red-600', sizes[size], className)}
        viewBox="0 0 24 24"
        aria-label="Cargando"
        role="status"
    >
        <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
        />
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4A4 4 0 008 12H4z"
        />
    </svg>
);
