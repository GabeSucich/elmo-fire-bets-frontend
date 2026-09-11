import { GamblerPerformance, GamblingSeasonService } from "@/api"
import { setApiErrorMsg } from "@/util/error"
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react"
import { useToastContext } from "./toastContext"

export interface PerformancesContextType {
    performances: Record<string, GamblerPerformance> | null
    /** What each gambler's bozos have cost, by gambler id. Absent where nobody has. */
    lossLedger: Record<string, number>
    /** The season's running total per person across every closed lay. */
    seasonNetPp: number
    /** Wins nobody has recorded a payout for, which the total above leaves out. */
    winsMissingPayout: number
    loading: boolean
    /**
     * Whether the first fetch has come back. Separate from `loading` so a screen can block
     * on arriving here without unmounting on every later refresh — which, for a tab
     * navigator, throws the viewer back to the first tab mid-pull.
     */
    initialized: boolean
    reload: () => void
    /** Keyed on the performance's own gambler_id, not the record key. */
    performanceFor: (gamblerId: number) => GamblerPerformance | undefined
}

const PerformancesContext = createContext<PerformancesContextType | null>(null)

export function usePerformancesContext() {
    const context = useContext(PerformancesContext)
    if (!context) {
        throw new Error("usePerformancesContext must be used inside a PerformancesProvider")
    }
    return context
}

type Props = {
    seasonId: number
    children: ReactNode
}

/**
 * Season performance data, fetched once and shared.
 *
 * Analytics renders it directly; the parlay tree uses it to warn when a pick lands on the
 * gambler's ban list. Both tabs live under one season, so one fetch serves them.
 */
export function PerformancesProvider({ seasonId, children }: Props) {
    const { showToast } = useToastContext()
    const [loading, setLoading] = useState(true)
    const [performances, setPerformances] = useState<Record<string, GamblerPerformance> | null>(null)
    const [lossLedger, setLossLedger] = useState<Record<string, number>>({})
    const [initialized, setInitialized] = useState(false)
    const [seasonNetPp, setSeasonNetPp] = useState(0)
    const [winsMissingPayout, setWinsMissingPayout] = useState(0)

    function reload() {
        setLoading(true)
        GamblingSeasonService.getSeasonGamblerPerformances(seasonId)
            .then(res => {
                setPerformances(res.performances)
                setLossLedger(res.loss_ledger)
                setSeasonNetPp(res.season_net_pp)
                setWinsMissingPayout(res.wins_missing_payout)
            })
            .catch(e => setApiErrorMsg(
                e,
                message => showToast(message, {
                    sticky: true,
                    action: { label: "Retry", onPress: reload }
                }),
                "There was an error loading performance data"
            ))
            .finally(() => {
                setLoading(false)
                // On settle rather than on success: a first fetch that failed has still
                // had its turn, and blocking forever behind a spinner is worse than the
                // empty state with the retry toast over it.
                setInitialized(true)
            })
    }

    // `reload` is redefined every render, but everything it closes over that matters is
    // the season id — which is listed, so the closure is never stale when it counts.
    useEffect(() => {
        reload()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seasonId])

    const byGambler = useMemo(() => {
        if (!performances) return new Map<number, GamblerPerformance>()
        return new Map(Object.values(performances).map(p => [p.gambler_id, p]))
    }, [performances])

    return (
        <PerformancesContext.Provider value={{
            performances,
            lossLedger,
            seasonNetPp,
            winsMissingPayout,
            loading,
            initialized,
            reload,
            performanceFor: (gamblerId: number) => byGambler.get(gamblerId),
        }}>
            {children}
        </PerformancesContext.Provider>
    )
}
