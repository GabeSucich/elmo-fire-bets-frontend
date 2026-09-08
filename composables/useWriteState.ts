import { useRef, useState } from "react"

/**
 * The bookkeeping every write in a list or a thread shares: which row it belongs to, and
 * what to run if it lands.
 *
 * `done` is fired only on success, so a failed save leaves the form open with its text
 * intact rather than closing over a toast.
 *
 * Lifted out of useFeedback so the suggestions list and the shared comment thread use one
 * copy — they had identical needs and the second one would have drifted.
 */
export default function useWriteState() {
    const [saving, setSaving] = useState(false)
    const [pendingId, setPendingId] = useState<number | null>(null)
    const onSuccess = useRef<(() => void) | null>(null)
    // Deletes come back with no body, so the row to drop is remembered across the call.
    const targetId = useRef<number | null>(null)

    return {
        saving,
        pendingId,
        target: targetId,
        begin(id: number | null, done?: () => void) {
            setPendingId(id)
            targetId.current = id
            onSuccess.current = done ?? null
        },
        finish() {
            onSuccess.current?.()
            onSuccess.current = null
        },
        track(value: boolean | ((prev: boolean) => boolean)) {
            setSaving(value)
            if (value === false) {
                setPendingId(null)
                onSuccess.current = null
            }
        },
    }
}
