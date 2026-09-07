import { useMemo } from "react"
import { Gambler, useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"

/**
 * Season gamblers with the signed-in one first, then the context's own ordering.
 *
 * Shared so every per-gambler list on the analytics screens reads in the same order —
 * finding yourself in a different place on each tab is disorienting.
 */
export function useGamblersMeFirst(): Gambler[] {
    const { gamblerId, sortedGamblers } = useGamblingSeasonContext()

    return useMemo(
        () => [...sortedGamblers].sort((a, b) => {
            if (a.id === gamblerId) return -1
            if (b.id === gamblerId) return 1
            return 0
        }),
        [sortedGamblers, gamblerId]
    )
}
