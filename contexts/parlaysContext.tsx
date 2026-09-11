import { ParlaysService, PickResponseData, UpdateParlayRequestData } from "@/api";
import { useToastContext } from "@/contexts/toastContext";
import { setApiErrorMsg } from "@/util/error";
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
    syncProgress: (parlayId: number) => void
    syncingParlayId: number | null
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
    // Which parlay is mid-sync, so only that card spins rather than the whole list.
    const [syncingParlayId, setSyncingParlayId] = useState<number | null>(null)
    const { showToast } = useToastContext()

    /**
     * Read one parlay's legs off the live boxscore.
     *
     * Open to anyone looking at it, because it only ever writes what ESPN says and never
     * touches a result. Two people watching the same game will press it at the same
     * moment; the server takes a lock and tells the loser it did nothing, which is worth
     * saying out loud rather than leaving them with a spinner that changed nothing.
     */
    function syncProgress(parlayId: number) {
        setSyncingParlayId(parlayId)
        ParlaysService.syncParlayProgress(parlayId)
            .then(res => {
                if (!res.ran) {
                    showToast("Someone else is already syncing this parlay")
                    return
                }
                refreshParlay(parlayId)
                // The reasons, not a count. "2 picks could not be read" tells nobody
                // whether to fix the lay's date, wait, or press again — and the three
                // things that cause it want three different responses. Duplicates are
                // collapsed because a five-leg lay on one fixture reports the same
                // sentence five times.
                const reasons = Array.from(new Set(res.skipped))
                if (reasons.length > 0) {
                    showToast(reasons.slice(0, 2).join("\n")
                        + (reasons.length > 2 ? `\n+${reasons.length - 2} more` : ""))
                }
            })
            .catch(e => setApiErrorMsg(
                e,
                message => showToast(message),
                "There was an error syncing progress"
            ))
            .finally(() => setSyncingParlayId(null))
    }

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
            updateParlay,
            syncProgress,
            syncingParlayId
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
