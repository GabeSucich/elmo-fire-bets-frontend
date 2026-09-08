import { PickResponseData, UpdateParlayRequestData } from "@/api";
import React, { createContext, useContext, ReactNode, useState } from "react";

export type ParlayTab = "Building" | "Open" | "Closed" | "My Lays"

interface ParlaysContextType {
    refreshParlays: () => void
    refreshParlay: (parlayId: number) => void
    patchPick: (parlayId: number, pickId: number, change: (pick: PickResponseData) => PickResponseData) => void
    navToTab: (tab: ParlayTab) => void
    focusedParlayId: number | null
    setFocusedParlayId: (id: number | null) => void
    handleSwapSelect: (parlayId: number) => void
    isStagedForSwap: (parlayId: number) => boolean
    updateParlay: (request: UpdateParlayRequestData) => void
    deleteParlay: (parlayId: number) => void
    lockParlay: (parlayId: number, afterLock: (parlayId: number) => void) => void
    unlockParlay: (parlayId: number, afterUnlock: (parlayId: number) => void) => void
    reopenParlay: (parlayId: number, afterReopen: (parlayId: number) => void) => void
    claimParlay: (parlayId: number, gamblerId: number) => void
}

const ParlaysContext = createContext<ParlaysContextType | null>(null);

interface ParlaysProviderProps {
    children: ReactNode
    refreshParlays: () => void
    refreshParlay: (parlayId: number) => void
    patchPick: (parlayId: number, pickId: number, change: (pick: PickResponseData) => PickResponseData) => void
    navToTab: (tab: ParlayTab) => void
    swapParlays: (parlayId1: number, parlayId2: number) => void
    updateParlay: (request: UpdateParlayRequestData) => void
    deleteParlay: (parlayId: number) => void
    lockParlay: (parlayId: number, afterLock: (parlayId: number) => void) => void
    unlockParlay: (parlayId: number, afterUnlock: (parlayId: number) => void) => void
    reopenParlay: (parlayId: number, afterReopen: (parlayId: number) => void) => void
    claimParlay: (parlayId: number, gamblerId: number) => void
}

export function ParlaysProvider({ 
    children, 
    refreshParlays,
    refreshParlay,
    patchPick,
    navToTab,
    swapParlays,
    updateParlay,
    deleteParlay,
    lockParlay,
    unlockParlay,
    reopenParlay,
    claimParlay
}: ParlaysProviderProps) {
    const [focusedParlayId, setFocusedParlayId] = useState<number | null>(null)
    const [swapIds, setSwapIds] = useState<number[]>([])

    function handleSwapSelect(parlayId: number) {
        if (swapIds.length === 0) {
            setSwapIds([parlayId])
        } else if (swapIds.length === 1) {
            const otherSwapId = swapIds[0]
            if (otherSwapId === parlayId) {
                setSwapIds([])
            } else {
                setSwapIds([])
                swapParlays(parlayId, otherSwapId)
            }
        }
    }

    function isStagedForSwap(parlayId: number) {
        return swapIds.includes(parlayId)
    }

    return (
        <ParlaysContext.Provider 
        value={{ 
            refreshParlays, 
            refreshParlay, 
            patchPick,
            navToTab, 
            focusedParlayId, 
            setFocusedParlayId,
            isStagedForSwap,
            handleSwapSelect,
            deleteParlay,
            lockParlay,
            unlockParlay,
            reopenParlay,
            claimParlay,
            updateParlay
        }}
        >
            {children}
        </ParlaysContext.Provider>
    );
}

export function useParlaysContext() {
    const context = useContext(ParlaysContext);
    if (!context) {
        throw new Error("useParlaysContext must be called from within a ParlaysProvider");
    }
    return context;
}
