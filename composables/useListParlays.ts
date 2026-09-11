import { GamblingSeasonService, ParlayState, ParlayResponseData, ParlaysService, GetSeasonParlaysSortParam, PickResponseData, UpdateParlayRequestData } from "@/api"
import { setApiErrorMsg } from "@/util/error"
import { useEffect, useRef, useState } from "react"
import { useToastContext } from "@/contexts/toastContext"

export type ParlayLoadingStates = Record<number, boolean>

export function useListParlays(seasonId: number, state: ParlayState, opts?: {
    limit?: number,
    sort?: GetSeasonParlaysSortParam
}) {

    const limit = opts?.limit ?? 10

    const { showToast } = useToastContext()

    const [parlays, setParlays] = useState<ParlayResponseData[]>([])
    const [parlaysLoading, setParlaysLoading] = useState(false)
    const [parlayLoadingStates, setParlayLoadingStates] = useState<ParlayLoadingStates>({})
    const [canLoadMore, setCanLoadMore] = useState(true)

    const [offset, setOffset] = useState(0)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const loadIdRef = useRef(0)


    function loadParlays(fromOffset: number, append: boolean) {
        const currentLoadId = ++loadIdRef.current
        setParlaysLoading(true)
        GamblingSeasonService.getSeasonParlays(
            seasonId,
            limit,
            fromOffset,
            state,
            opts?.sort
        ).then(response => {
            if (currentLoadId !== loadIdRef.current) return
            if (response.parlays.length > 0) {
                setParlays(prev => append ? [...prev, ...response.parlays] : response.parlays)
                setOffset(response.next_offset)
                setCanLoadMore(limit - response.parlays.length < 5)
            } else {
                setCanLoadMore(false)
            }
        }).catch(err => {
            if (currentLoadId !== loadIdRef.current) return
            setApiErrorMsg(
                err,
                message => showToast(message, {
                    sticky: true,
                    action: { label: "Retry", onPress: () => loadParlays(fromOffset, append) }
                }),
                "There was an error while loading parlays"
            )
        }).finally(() => {
            if (currentLoadId === loadIdRef.current) {
                setParlaysLoading(false)
            }
        })
    }

    function loadNextParlays() {
        loadParlays(offset, true)
    }

    // `loadParlays` is rebuilt every render, so listing it would re-fetch on every render.
    // The trigger is the only thing that should start a load.
    useEffect(() => {
        loadParlays(0, false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshTrigger])

    function updateParlayLoadingState(parlayId: number, loading: boolean) {
        setParlayLoadingStates(prev => ({ ...prev, [parlayId]: loading }))
    }

    /** Clears the row's spinner and surfaces the failure as a toast. */
    function handleParlayError(parlayIds: number[], defaultMessage: string) {
        return (e: unknown) => {
            parlayIds.forEach(id => updateParlayLoadingState(id, false))
            setApiErrorMsg(e, message => showToast(message), defaultMessage)
        }
    }

    /**
     * Change one pick in place, without a round trip.
     *
     * Reactions and reply counts are the writes whose new value comes back with the
     * response, so refreshParlay would only re-fetch a parlay to learn what it already
     * knows — and would raise that row's spinner over a chip tap while it did.
     *
     * Everything showing a pick reads it from here, so one call moves the chips on the
     * card and the chips in the open drawer together: they are the same object.
     */
    function patchPick(parlayId: number, pickId: number, change: (pick: PickResponseData) => PickResponseData) {
        setParlays(prev => prev.map(parlay => {
            if (parlay.id !== parlayId) return parlay
            return {
                ...parlay,
                picks: parlay.picks.map(pick => pick.id === pickId ? change(pick) : pick),
            }
        }))
    }

    function refreshParlay(parlayId: number) {
        updateParlayLoadingState(parlayId, true)
        ParlaysService.getParlay(parlayId)
        .then(res => {
            if (res.parlay.state !== state) {
                setParlays(prev => prev.filter(p => p.id !== res.parlay.id))
            } else {
                setParlays(prev => prev.map(p => {
                if (p.id === res.parlay.id) return res.parlay
                    return p
                }))
            }
            updateParlayLoadingState(parlayId, false)
        })
        .catch(handleParlayError([parlayId], "There was an error loading the parlay"))
    }

    function claimParlay(parlayId: number, gamblerId: number) {
        updateParlayLoadingState(parlayId, true)
        ParlaysService.claimParlay(parlayId, {
            gambler_id: gamblerId
        })
        .then(res => {
            updateParlayLoadingState(parlayId, false)
            refreshParlay(parlayId)
        })
        .catch(handleParlayError([parlayId], "There was an error claiming the parlay"))
    }

    function updateParlay(request: UpdateParlayRequestData) {
        updateParlayLoadingState(request.parlay_id, true)
        ParlaysService.updateParlay(request)
        .then(res => {
            updateParlayLoadingState(request.parlay_id, false)
            refreshParlay(request.parlay_id)
        }).catch(handleParlayError([request.parlay_id], "There was an error updating the parlay"))
    }

    function lockParlay(parlayId: number, afterLock: (parlayId: number) => void) {
        updateParlayLoadingState(parlayId, true)
        ParlaysService.lockParlay(parlayId, {pick_overrides: {}})
        .then(res => {
            updateParlayLoadingState(parlayId, false)
            refreshParlays()
            afterLock(parlayId)
        })
        .catch(handleParlayError([parlayId], "There was an error locking the parlay"))
    }

    function unlockParlay(parlayId: number, afterUnlock: (parlayId: number) => void) {
        updateParlayLoadingState(parlayId, true)
        ParlaysService.unlockParlay(parlayId, {})
        .then(res => {
            updateParlayLoadingState(parlayId, false)
            refreshParlays()
            afterUnlock(parlayId)
        })
        .catch(handleParlayError([parlayId], "There was an error unlocking the parlay"))
    }

    function reopenParlay(parlayId: number, afterReopen: (parlayId: number) => void) {
        updateParlayLoadingState(parlayId, true)
        ParlaysService.reopenParlay(parlayId, {})
        .then(res => {
            updateParlayLoadingState(parlayId, false)
            refreshParlays()
            afterReopen(parlayId)
        })
        .catch(handleParlayError([parlayId], "There was an error reopening the parlay"))
    }

    function deleteParlay(parlayId: number) {
        updateParlayLoadingState(parlayId, true)
        ParlaysService.deleteParlay(parlayId)
        .then(res => {
            setParlays(prev => prev.filter(p => p.id !== parlayId))
            updateParlayLoadingState(parlayId, false)
        })
        .catch(handleParlayError([parlayId], "There was an error deleting the parlay"))
    }

    function swapParlays(parlayId_1: number, parlayId_2: number) {
        updateParlayLoadingState(parlayId_1, true)
        updateParlayLoadingState(parlayId_2, true)
        ParlaysService.swapParlayOrder({parlay_id_1: parlayId_1, parlay_id_2: parlayId_2})
        .then(res => {
            updateParlayLoadingState(parlayId_1, false)
            updateParlayLoadingState(parlayId_2, false)
            refreshParlays()
        }).catch(handleParlayError([parlayId_1, parlayId_2], "There was an error swapping parlay order"))
    }

    function refreshParlays() {
        setParlays([])
        setOffset(0)
        setCanLoadMore(true)
        setRefreshTrigger(prev => prev + 1)
    }

    return {
        parlays,
        loadNextParlays,
        parlayLoadingStates,
        canLoadMore,
        parlaysLoading,
        refreshParlays,
        refreshParlay,
        patchPick,
        deleteParlay,
        claimParlay,
        updateParlay,
        lockParlay,
        unlockParlay,
        reopenParlay,
        swapParlays
    }
}
