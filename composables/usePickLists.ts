import { useCallback, useEffect, useRef, useState } from "react"
import {
    PickListItemRequestData,
    PickListResponseData,
    PickListsService,
} from "@/api"
import useApiActionState from "./useApiActionState"

export type PickListsState = {
    lists: PickListResponseData[]
    editable: boolean
}

const EMPTY: PickListsState = { lists: [], editable: false }

export type PickListsData = ReturnType<typeof usePickLists>

/**
 * The season's lists, and the writes one gambler may make to their own entries.
 *
 * Shaped like useSeasonPicks, down to reloading after every write rather than patching in
 * place: the screen shows the whole league's entries and a write is one row among them, so
 * a reload is a single small request and cannot drift from what the server thinks.
 */
export function usePickLists(seasonId: number) {
    const [state, setState] = useState<PickListsState>(EMPTY)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    // Separate from `loading`, for the same reason season picks keeps it: the first load
    // blocks, and every later reload must not unmount what is rendering this.
    const [initialized, setInitialized] = useState(false)
    // Which entry a write is in flight for, so a row can show its own spinner.
    const [pendingItemId, setPendingItemId] = useState<number | null>(null)
    // Fired only on success, so a failed save leaves the editor open with its input intact.
    const onSuccess = useRef<(() => void) | null>(null)

    const { execute: load } = useApiActionState(
        PickListsService.listPickLists,
        response => {
            setState({ lists: response.pick_lists, editable: response.editable })
            setInitialized(true)
        },
        setLoading,
        "There was an error loading lists",
        { retryable: true }
    )

    // `load` is a fresh closure every render, so it is deliberately not a dependency.
    const reload = useCallback(() => load(seasonId), [seasonId]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        reload()
    }, [reload])

    function afterWrite() {
        reload()
        onSuccess.current?.()
        onSuccess.current = null
    }

    function trackSaving(value: boolean | ((prev: boolean) => boolean)) {
        setSaving(value)
        if (value === false) {
            setPendingItemId(null)
            onSuccess.current = null
        }
    }

    const { execute: createItem } = useApiActionState(
        PickListsService.createPickListItem, afterWrite, trackSaving,
        "There was an error adding that entry"
    )
    const { execute: updateItem } = useApiActionState(
        PickListsService.updatePickListItem, afterWrite, trackSaving,
        "There was an error saving that entry"
    )
    const { execute: deleteItem } = useApiActionState(
        PickListsService.deletePickListItem, afterWrite, trackSaving,
        "There was an error removing that entry"
    )

    return {
        ...state,
        loading,
        initialized,
        saving,
        pendingItemId,
        reload,
        addItem: (pickListId: number, body: PickListItemRequestData, done?: () => void) => {
            onSuccess.current = done ?? null
            createItem(pickListId, body)
        },
        saveItem: (itemId: number, body: PickListItemRequestData, done?: () => void) => {
            onSuccess.current = done ?? null
            setPendingItemId(itemId)
            updateItem(itemId, body)
        },
        removeItem: (itemId: number) => {
            setPendingItemId(itemId)
            deleteItem(itemId)
        },
    }
}
