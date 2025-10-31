import React from 'react';
import clsx from 'clsx';

export interface ContainerProps {
    readonly className?: string;
    readonly children?: React.ReactNode;
    readonly size?: 'sm' | 'md' | 'lg' | 'xl';
}

const maxw: Record<NonNullable<ContainerProps['size']>, string> = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
};

export const Container: React.FC<ContainerProps> = ({
    className,
    children,
    size = 'lg',
}) => {
    return (
        <div
            className={clsx(
                'mx-auto w-full px-4 md:px-6',
                maxw[size],
                className
            )}
        >
            {children}
        </div>
    );
};
