import { GamblingSeasonService, GamblingSeasonState } from "@/api"
import { useEffect, useState } from "react"
import useApiActionState from "./useApiActionState"

export interface GamblerSeason {
    seasonId: number
    gamblerId: number
    name: string
    year: number
    state: GamblingSeasonState
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
                    name: s.name
                }))
                .sort((a, b) => a.year - b.year)
                setGamblerSeasons(seasons)
        },
        setLoading,
        "There was an error loading your gambling seasons",
        { retryable: true }
    )

    useEffect(() => {
        loadSeasonSelections()
    }, [])

    return {
        gamblerSeasons,
        loadSeasonSelections,
        loading
    }

}