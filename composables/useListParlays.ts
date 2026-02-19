import { GamblingSeasonService, GetSeasonParlaysResponseData, ParlayState, ParlayResponseData, ParlaysService, GetSeasonParlaysSortParam } from "@/api"
import { setApiErrorMsg } from "@/util/error"
import { useEffect, useRef, useState } from "react"

export type ParlayLoadingStates = Record<number, {loading: boolean, error: string | null}>

export function useListParlays(seasonId: number, state: ParlayState, opts?: {
    limit?: number,
    sort?: GetSeasonParlaysSortParam
}) {

    const limit = opts?.limit ?? 10

    const [parlays, setParlays] = useState<ParlayResponseData[]>([])
    const [bulkLoading, setBulkLoading] = useState(false)
    const [bulkError, setBulkError] = useState<string | null>(null)
    const [parlayLoadingStates, setParlayLoadingStates] = useState<ParlayLoadingStates>({})
    const [canLoadMore, setCanLoadMore] = useState(true)

    const [offset, setOffset] = useState(0)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const loadIdRef = useRef(0)

    function loadParlays(fromOffset: number, append: boolean) {
        const currentLoadId = ++loadIdRef.current
        setBulkLoading(true)
        setBulkError(null)
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
            } else {
                setCanLoadMore(false)
            }
        }).catch(err => {
            if (currentLoadId !== loadIdRef.current) return
            setApiErrorMsg(err, setBulkError, "There was an error while loading parlays")
        }).finally(() => {
            if (currentLoadId === loadIdRef.current) {
                setBulkLoading(false)
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
            setParlays(prev => prev.map(p => {
                if (p.id === parlayId) return res.parlay
                return p
            }))
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
        bulkLoading,
        bulkError,
        refreshParlays,
        refreshParlay,
        swapParlays
    }
}
