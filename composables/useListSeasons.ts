import { GamblingSeasonService, GamblingSeasonState } from "@/api"
import { useEffect, useState } from "react"
import useApiActionState from "./useApiActionState"

export interface GamblerSeason {
    seasonId: number
    gamblerId: number
    name: string
    year: number
    state: GamblingSeasonState
    /** Whether this user runs this season. The header menu sits outside the season's
     *  providers, so it can only learn this from the route it was pushed with. */
    isAdmin: boolean
}

export function useListSeasons() {
    const [gamblerSeasons, setGamblerSeasons] = useState<GamblerSeason[]>([])
    const [loading, setLoading] = useState(false)

    const {
        execute: loadSeasonSelections
    } = useApiActionState(
        GamblingSeasonService.getUserGamblingSeasons,
        response => {
            const seasons: GamblerSeason[] = 
                response
                .seasons.map(s => ({
                    seasonId: s.id,
                    gamblerId: s.gambler_id,
                    year: s.year,
                    state: s.state,
                    name: s.name,
                    isAdmin: s.is_admin,
                }))
                .sort((a, b) => a.year - b.year)
                setGamblerSeasons(seasons)
        },
        setLoading,
        "There was an error loading your gambling seasons",
        { retryable: true }
    )

    // `execute` from useApiActionState is a fresh closure each render; depending on it
    // would load the list again on every one. This is a mount-only load.
    useEffect(() => {
        loadSeasonSelections()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return {
        gamblerSeasons,
        loadSeasonSelections,
        loading
    }

}