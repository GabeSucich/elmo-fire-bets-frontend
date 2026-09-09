import { useCallback, useEffect, useRef, useState } from "react"
import {
    ListSeasonPicksResponseData,
    SeasonPickRequestData,
    SeasonPicksService,
    SeasonPickResponseData,
    WeekProgressRequestData,
    WeeksProgressRequestData,
} from "@/api"
import useApiActionState from "./useApiActionState"

export type SeasonPicksState = {
    picks: SeasonPickResponseData[]
    enabled: boolean
    weeks: number
    pickCount: number
    latestOpenWeek: number
    viewerIsAdmin: boolean
    editable: boolean
}

const EMPTY: SeasonPicksState = {
    picks: [],
    enabled: false,
    weeks: 0,
    pickCount: 0,
    latestOpenWeek: 0,
    viewerIsAdmin: false,
    editable: false,
}

function toState(response: ListSeasonPicksResponseData): SeasonPicksState {
    return {
        picks: response.season_picks,
        enabled: response.season_long_picks_enabled,
        weeks: response.weeks,
        pickCount: response.pick_count,
        latestOpenWeek: response.latest_open_week,
        viewerIsAdmin: response.viewer_is_admin,
        editable: response.editable,
    }
}

export type SeasonPicksData = ReturnType<typeof useSeasonPicks>

export function useSeasonPicks(seasonId: number) {
    const [state, setState] = useState<SeasonPicksState>(EMPTY)
    const [loading, setLoading] = useState(true)
    // Its own flag rather than `saving`: a sync is a whole-season operation that takes
    // seconds and blocks the screen, where `saving` marks one pick being written.
    const [syncing, setSyncing] = useState(false)
    const [saving, setSaving] = useState(false)
    // Separate from `loading` so callers can block on the first load without unmounting
    // on every later refresh — a reload after a write would otherwise tear down whatever
    // is rendering this and lose its state.
    const [initialized, setInitialized] = useState(false)

    const { execute: load } = useApiActionState(
        SeasonPicksService.listSeasonPicks,
        response => {
            setState(toState(response))
            setInitialized(true)
        },
        setLoading,
        "There was an error loading season picks",
        { retryable: true }
    )

    // `load` comes from useApiActionState, which builds a fresh closure every render, so
    // it is deliberately not a dependency — including it would re-fetch on every render.
    const reload = useCallback(() => load(seasonId), [seasonId]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        reload()
    }, [reload])

    // Which pick a write is currently in flight for, so the UI can put a loader over
    // that row rather than over everything.
    const [pendingPickId, setPendingPickId] = useState<number | null>(null)
    // Fired only on success, so a failed save leaves the form open with its input intact
    // instead of closing over a toast.
    const onSuccess = useRef<(() => void) | null>(null)

    /**
     * Mutations reload rather than patching state in place: totals, status and
     * next_week_to_enter are all derived on the server, so a local edit would have to
     * duplicate that arithmetic to stay honest.
     */
    function afterWrite() {
        reload()
        onSuccess.current?.()
        onSuccess.current = null
    }

    function trackSaving(value: boolean | ((prev: boolean) => boolean)) {
        setSaving(value)
        if (value === false) {
            setPendingPickId(null)
            onSuccess.current = null
        }
    }

    const { execute: createPick } = useApiActionState(
        SeasonPicksService.createSeasonPick, afterWrite, trackSaving,
        "There was an error adding that pick"
    )
    const { execute: updatePick } = useApiActionState(
        SeasonPicksService.updateSeasonPick, afterWrite, trackSaving,
        "There was an error updating that pick"
    )
    const { execute: deletePick } = useApiActionState(
        SeasonPicksService.deleteSeasonPick, afterWrite, trackSaving,
        "There was an error deleting that pick"
    )
    const { execute: finalizePick } = useApiActionState(
        SeasonPicksService.finalizeSeasonPick, afterWrite, trackSaving,
        "There was an error finalizing that pick"
    )
    const { execute: updateWeeks } = useApiActionState(
        SeasonPicksService.updateSeasonPickWeeks, afterWrite, trackSaving,
        "There was an error saving those weeks"
    )
    const { execute: updateWeek } = useApiActionState(
        SeasonPicksService.updateSeasonPickWeek, afterWrite, trackSaving,
        "There was an error saving that week"
    )

    const { execute: runSync } = useApiActionState(
        SeasonPicksService.syncSeasonPicks,
        // Everything on screen is derived from week rows, and a sync rewrites them across
        // every gambler — so this reloads rather than trying to patch anything in place.
        () => reload(),
        setSyncing,
        "There was an error syncing with ESPN"
    )

    return {
        ...state,
        loading,
        initialized,
        saving,
        syncing,
        sync: () => runSync(seasonId),
        pendingPickId,
        reload,
        createPick: (body: SeasonPickRequestData, done?: () => void) => {
            onSuccess.current = done ?? null
            createPick(seasonId, body)
        },
        updatePick: (pickId: number, body: SeasonPickRequestData, done?: () => void) => {
            onSuccess.current = done ?? null
            setPendingPickId(pickId)
            updatePick(pickId, body)
        },
        deletePick: (pickId: number) => {
            setPendingPickId(pickId)
            deletePick(pickId)
        },
        setFinalized: (pickId: number, finalized: boolean) => {
            setPendingPickId(pickId)
            finalizePick(pickId, { finalized })
        },
        saveWeek: (pickId: number, week: number, body: WeekProgressRequestData) =>
            updateWeek(pickId, week, body),
        saveWeeks: (pickId: number, body: WeeksProgressRequestData, done?: () => void) => {
            onSuccess.current = done ?? null
            setPendingPickId(pickId)
            updateWeeks(pickId, body)
        },
    }
}
