import { GamblingSeasonService, GetSeasonParlaysResponseData, ParlayState, ParlayResponseData, ParlaysService, GetSeasonParlaysSortParam, UpdateParlayRequestData } from "@/api"
import { setApiErrorMsg } from "@/util/error"
import { useEffect, useRef, useState } from "react"
import useApiActionState from "./useApiActionState"
import { ParlayEditArgs } from "@/components/parlays/common"

export type ParlayLoadingStates = Record<number, {loading: boolean, error: string | null}>

export function useListParlays(seasonId: number, state: ParlayState, opts?: {
    limit?: number,
    sort?: GetSeasonParlaysSortParam
}) {

    const limit = opts?.limit ?? 10

    const [parlays, setParlays] = useState<ParlayResponseData[]>([])
    const [parlaysLoading, setParlaysLoading] = useState(false)
    const [parlaysError, setParlaysError] = useState<string | null>(null)
    const [parlayLoadingStates, setParlayLoadingStates] = useState<ParlayLoadingStates>({})
    const [canLoadMore, setCanLoadMore] = useState(true)

    const [offset, setOffset] = useState(0)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const loadIdRef = useRef(0)


    function loadParlays(fromOffset: number, append: boolean) {
        const currentLoadId = ++loadIdRef.current
        setParlaysLoading(true)
        setParlaysError(null)
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
            setApiErrorMsg(err, setParlaysError, "There was an error while loading parlays")
        }).finally(() => {
            if (currentLoadId === loadIdRef.current) {
                setParlaysLoading(false)
            }
        })
    }

    function loadNextParlays() {
        loadParlays(offset, true)
    }

    useEffect(() => {
        loadParlays(0, false)
    }, [refreshTrigger])

    function updateParlayLoadingState(parlayId: number, loading: boolean, error: string | null) {
        setParlayLoadingStates(prev => ({ ...prev, [parlayId]: {error, loading} }))
    }

    function refreshParlay(parlayId: number) {
        updateParlayLoadingState(parlayId, true, null)
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
            updateParlayLoadingState(parlayId, false, null)
        })
        .catch(e => {
            setApiErrorMsg(
                e,
                msg => updateParlayLoadingState(parlayId, false, msg),
                "There was an error loading the parlay"
            )
        })
    }

    function claimParlay(parlayId: number, gamblerId: number) {
        updateParlayLoadingState(parlayId, true, null)
        ParlaysService.claimParlay(parlayId, {
            gambler_id: gamblerId
        })
        .then(res => {
            updateParlayLoadingState(parlayId, false, null)
            refreshParlay(parlayId)
        })
        .catch(e => {
            setApiErrorMsg(
                e,
                msg => updateParlayLoadingState(parlayId, false, msg),
                "There was an error claiming the parlay"
            )
        })
    }

    function updateParlay(request: UpdateParlayRequestData) {
        updateParlayLoadingState(request.parlay_id, true, null)
        ParlaysService.updateParlay(request)
        .then(res => {
            updateParlayLoadingState(request.parlay_id, false, null)
            refreshParlay(request.parlay_id)
        }).catch(e => {
            setApiErrorMsg(
                e,
                msg => updateParlayLoadingState(request.parlay_id, false, msg),
                "There was an error updating the parlay"
            )
        })
    }

    function lockParlay(parlayId: number, afterLock: (parlayId: number) => void) {
        updateParlayLoadingState(parlayId, true, null)
        ParlaysService.lockParlay(parlayId, {pick_overrides: {}})
        .then(res => {
            updateParlayLoadingState(parlayId, false, null)
            refreshParlays()
            afterLock(parlayId)
        })
        .catch(e => {
            setApiErrorMsg(
                e,
                msg => updateParlayLoadingState(parlayId, false, msg),
                "There was an error locking the parlay"
            )
        })
    }

    function unlockParlay(parlayId: number, afterUnlock: (parlayId: number) => void) {
        updateParlayLoadingState(parlayId, true, null)
        ParlaysService.unlockParlay(parlayId, {})
        .then(res => {
            updateParlayLoadingState(parlayId, false, null)
            refreshParlays()
            afterUnlock(parlayId)
        })
        .catch(e => {
            setApiErrorMsg(
                e,
                msg => updateParlayLoadingState(parlayId, false, msg),
                "There was an error unlocking the parlay"
            )
        })
    }

    function reopenParlay(parlayId: number, afterReopen: (parlayId: number) => void) {
        updateParlayLoadingState(parlayId, true, null)
        ParlaysService.reopenParlay(parlayId, {})
        .then(res => {
            updateParlayLoadingState(parlayId, false, null)
            refreshParlays()
            afterReopen(parlayId)
        })
        .catch(e => {
            setApiErrorMsg(
                e,
                msg => updateParlayLoadingState(parlayId, false, msg),
                "There was an error reopening the parlay"
            )
        })
    }

    function deleteParlay(parlayId: number) {
        updateParlayLoadingState(parlayId, true, null)
        ParlaysService.getParlay(parlayId)
        .then(res => {
            setParlays(prev => prev.filter(p => p.id !== parlayId))
            updateParlayLoadingState(parlayId, false, null)
        })
        .catch(e => {
            setApiErrorMsg(
                e,
                msg => updateParlayLoadingState(parlayId, false, msg),
                "There was an error deleting the parlay"
            )
        })
    }

    function swapParlays(parlayId_1: number, parlayId_2: number) {
        updateParlayLoadingState(parlayId_1, true, null)
        updateParlayLoadingState(parlayId_2, true, null)
        ParlaysService.swapParlayOrder({parlay_id_1: parlayId_1, parlay_id_2: parlayId_2})
        .then(res => {
            updateParlayLoadingState(parlayId_1, false, null)
            updateParlayLoadingState(parlayId_2, false, null)
            refreshParlays()
        }).catch(e => {
            setApiErrorMsg(
                e,
                msg => {
                    updateParlayLoadingState(parlayId_1, false, msg)
                    updateParlayLoadingState(parlayId_2, false, msg)
                },
                "There was an error swapping parlay order"
            )
        })
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
        parlaysError,
        refreshParlays,
        refreshParlay,
        deleteParlay,
        claimParlay,
        updateParlay,
        lockParlay,
        unlockParlay,
        reopenParlay,
        swapParlays
    }
}
