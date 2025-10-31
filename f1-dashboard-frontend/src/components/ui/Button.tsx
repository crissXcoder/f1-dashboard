import React from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    readonly variant?: Variant;
    readonly size?: Size;
    readonly block?: boolean;
    readonly loading?: boolean;
}

const base =
    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
    // F1 theme: rojo dominante
    primary:
        'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600 focus:ring-offset-white dark:focus:ring-offset-neutral-900',
    // borde en rojo
    secondary:
        'border border-red-600 text-red-600 hover:bg-red-600 hover:text-white focus:ring-red-600 focus:ring-offset-white dark:focus:ring-offset-neutral-900',
    // minimal
    ghost:
        'text-red-600 hover:bg-red-50 dark:hover:bg-neutral-800 focus:ring-red-600 focus:ring-offset-white dark:focus:ring-offset-neutral-900',
};

const sizes: Record<Size, string> = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
};

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    block = false,
    loading = false,
    className,
    children,
    ...rest
}) => {
    return (
        <button
            className={clsx(
                base,
                variants[variant],
                sizes[size],
                block && 'w-full',
                className
            )}
            {...rest}
        >
            {loading && (
                <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
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
            )}
            {children}
        </button>
    );
};
