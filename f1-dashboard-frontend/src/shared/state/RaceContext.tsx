import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { initialRaceState, raceReducer } from './race.reducer';
import type { RaceAction, RaceState } from './race.reducer';

interface RaceContextValue {
    readonly state: RaceState;
    readonly dispatch: React.Dispatch<RaceAction>;
}

const RaceContext = createContext<RaceContextValue | null>(null);

export const RaceProvider: React.FC<{ readonly children?: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(raceReducer, initialRaceState);
    const value = useMemo(() => ({ state, dispatch }), [state]);
    return <RaceContext.Provider value={value}>{children}</RaceContext.Provider>;
};

export function useRace() {
    const ctx = useContext(RaceContext);
    if (!ctx) throw new Error('useRace must be used within <RaceProvider>');
    return ctx;
}

export function useRaceState() {
    return useRace().state;
}

export function useRaceDispatch() {
    return useRace().dispatch;
}
