import React from 'react';
import { Container } from './Container';

export interface HeaderProps {
    readonly title?: string;
    readonly rightSlot?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title = 'F1 Live Dashboard', rightSlot }) => {
    return (
        <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
            <Container className="flex h-14 items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Marca simple F1: bloque rojo */}
                    <div className="h-5 w-5 rounded-sm bg-red-600" aria-hidden />
                    <h1 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
                        {title}
                    </h1>
                </div>
                <div className="flex items-center gap-2">{rightSlot}</div>
            </Container>
        </header>
    );
};
