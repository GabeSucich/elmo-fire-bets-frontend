import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    FeedbackCommentResponseData,
    FeedbackResponseData,
    FeedbackService,
    FeedbackStatus,
    FeedbackVotersResponseData,
    VoteRequestData,
} from "@/api"
import { VoteDirection } from "@/components/feedback/VoteControl"
import useApiActionState from "./useApiActionState"
import { parseServerTime } from "@/util/relativeTime"

/** Anything raised this recently leads the list, ahead of the ranked backlog. */
export const NEW_FEEDBACK_HOURS = 72

function isNew(feedback: FeedbackResponseData, now: number): boolean {
    return now - parseServerTime(feedback.created_at) < NEW_FEEDBACK_HOURS * 60 * 60 * 1000
}

/**
 * The bookkeeping every write here shares: which row it belongs to, and what to run if it
 * lands. `done` is fired only on success, so a failed save leaves the form open with its
 * text intact rather than closing over a toast.
 */
function useWriteState() {
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

export type FeedbackData = ReturnType<typeof useFeedback>

export function useFeedback(seasonId: number) {
    const [feedback, setFeedback] = useState<FeedbackResponseData[]>([])
    const [viewerIsAdmin, setViewerIsAdmin] = useState(false)
    const [loading, setLoading] = useState(true)
    // Separate from `loading` so the screen blocks on the first load only — a refresh
    // after a write would otherwise unmount whatever is rendering this.
    const [initialized, setInitialized] = useState(false)
    const writes = useWriteState()

    const { execute: load } = useApiActionState(
        FeedbackService.listFeedback,
        response => {
            setFeedback(response.feedback)
            setViewerIsAdmin(response.viewer_is_admin)
            setInitialized(true)
        },
        setLoading,
        "There was an error loading suggestions",
        { retryable: true }
    )

    // `load` is rebuilt on every render by useApiActionState, so it is deliberately not a
    // dependency — including it would re-fetch continuously.
    const reload = useCallback(() => load(seasonId), [seasonId]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        reload()
    }, [reload])

    function patchRow(id: number, change: (row: FeedbackResponseData) => FeedbackResponseData) {
        setFeedback(current => current.map(f => (f.id === id ? change(f) : f)))
    }

    /**
     * Writes that return the row they changed patch it in place rather than re-fetching.
     * The new score comes back with the row and useFeedbackSections re-ranks from it, so a
     * round trip would buy nothing but a stale beat before the card moves.
     */
    function replaceRow(updated: FeedbackResponseData) {
        patchRow(updated.id, () => updated)
        writes.finish()
    }

    function dropRow() {
        setFeedback(current => current.filter(f => f.id !== writes.target.current))
        writes.finish()
    }

    /** The one write that reloads: only the server knows where a new suggestion ranks. */
    function afterCreate() {
        reload()
        writes.finish()
    }

    const { execute: createFeedback } = useApiActionState(
        FeedbackService.createFeedback, afterCreate, writes.track,
        "There was an error submitting that suggestion"
    )
    const { execute: updateFeedback } = useApiActionState(
        FeedbackService.updateFeedback, res => replaceRow(res.feedback), writes.track,
        "There was an error saving that suggestion"
    )
    const { execute: deleteFeedback } = useApiActionState(
        FeedbackService.deleteFeedback, dropRow, writes.track,
        "There was an error deleting that suggestion"
    )
    const { execute: vote } = useApiActionState(
        FeedbackService.voteOnFeedback, res => replaceRow(res.feedback), writes.track,
        "There was an error saving your vote"
    )
    const { execute: applyStatus } = useApiActionState(
        FeedbackService.setFeedbackStatus, res => replaceRow(res.feedback), writes.track,
        "There was an error updating that suggestion"
    )

    return {
        feedback,
        viewerIsAdmin,
        loading,
        initialized,
        saving: writes.saving,
        pendingId: writes.pendingId,
        reload,
        create: (comment: string, done?: () => void) => {
            writes.begin(null, done)
            createFeedback(seasonId, { comment })
        },
        update: (id: number, body: { title?: string, comment?: string }, done?: () => void) => {
            writes.begin(id, done)
            updateFeedback(id, body)
        },
        remove: (id: number, done?: () => void) => {
            writes.begin(id, done)
            deleteFeedback(id)
        },
        vote: (id: number, direction: VoteDirection) => {
            writes.begin(id)
            // The codegen names the enum members `_1` and `_-1`, which are unusable as
            // written; the values are the numbers themselves.
            vote(id, { value: direction as unknown as VoteRequestData.value })
        },
        setStatus: (id: number, status: FeedbackStatus) => {
            writes.begin(id)
            applyStatus(id, { status })
        },
        /**
         * Keeps the reply count on a card honest after the detail view has posted or
         * removed a reply, without re-fetching the list to learn a number it already has.
         */
        setCommentCount: (id: number, count: number) =>
            patchRow(id, row => ({ ...row, comment_count: count })),
    }
}

const byRecency = (a: FeedbackResponseData, b: FeedbackResponseData) =>
    parseServerTime(b.created_at) - parseServerTime(a.created_at)

/**
 * Highest score first, newest breaking a tie — the same order the server lists in, and the
 * order every section uses.
 *
 * Applied on the client as well so a vote re-ranks the list as it lands, rather than the
 * card holding its old place until the next load.
 */
const byScore = (a: FeedbackResponseData, b: FeedbackResponseData) =>
    b.score - a.score || byRecency(a, b)

/** The list split the way the screen shows it: open vs resolved, recent vs ranked. */
export function useFeedbackSections(feedback: FeedbackResponseData[]) {
    return useMemo(() => {
        const now = Date.now()
        const open = feedback.filter(f => f.status === FeedbackStatus.OPEN)
        return {
            recent: open.filter(f => isNew(f, now)).sort(byScore),
            ranked: open.filter(f => !isNew(f, now)).sort(byScore),
            resolved: feedback.filter(f => f.status === FeedbackStatus.RESOLVED).sort(byScore),
            retired: feedback.filter(f => f.status === FeedbackStatus.RETIRED).sort(byScore),
        }
    }, [feedback])
}

const NO_VOTERS: FeedbackVotersResponseData = { up: [], down: [] }

/**
 * Who voted on one suggestion, loaded when it is opened.
 *
 * `revision` is anything that means the tally has moved — the viewer's own vote — and
 * re-fetching on it keeps the names in step with the number above them.
 */
export function useFeedbackVoters(feedbackId: number | null, revision: number) {
    const [voters, setVoters] = useState<FeedbackVotersResponseData>(NO_VOTERS)
    const [loading, setLoading] = useState(false)

    const { execute: load } = useApiActionState(
        FeedbackService.listFeedbackVotes,
        setVoters,
        setLoading,
        "There was an error loading votes",
        { retryable: true }
    )

    useEffect(() => {
        if (feedbackId === null) {
            setVoters(NO_VOTERS)
            return
        }
        load(feedbackId)
    }, [feedbackId, revision]) // eslint-disable-line react-hooks/exhaustive-deps

    return { voters, loading }
}

/**
 * Replies for one suggestion, loaded when it is opened.
 *
 * They are kept out of the list response because most suggestions are never opened and the card
 * only needs the count. Every write returns the reply it changed, so the thread is patched
 * in place and no reply costs a second round trip.
 */
export function useFeedbackComments(feedbackId: number | null) {
    const [comments, setComments] = useState<FeedbackCommentResponseData[]>([])
    const [loading, setLoading] = useState(false)
    // Which suggestion the replies in hand actually belong to. An empty list means nothing until
    // this matches: before the first response it is the placeholder, not a reply count.
    const [loadedId, setLoadedId] = useState<number | null>(null)
    const requestedId = useRef<number | null>(null)
    const writes = useWriteState()

    const { execute: load } = useApiActionState(
        FeedbackService.listFeedbackComments,
        response => {
            setComments(response.comments)
            setLoadedId(requestedId.current)
        },
        setLoading,
        "There was an error loading replies",
        { retryable: true }
    )

    const reload = useCallback(() => {
        if (feedbackId === null) return
        requestedId.current = feedbackId
        load(feedbackId)
    }, [feedbackId]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        // Cleared first so opening a second suggestion never flashes the first one's replies.
        setComments([])
        setLoadedId(null)
        reload()
    }, [reload])

    // The thread is oldest-first, so a new reply belongs on the end — right above the box
    // it was typed in.
    function appendReply(added: FeedbackCommentResponseData) {
        setComments(current => [...current, added])
        writes.finish()
    }

    function replaceReply(updated: FeedbackCommentResponseData) {
        setComments(current => current.map(c => (c.id === updated.id ? updated : c)))
        writes.finish()
    }

    function dropReply() {
        setComments(current => current.filter(c => c.id !== writes.target.current))
        writes.finish()
    }

    const { execute: createComment } = useApiActionState(
        FeedbackService.createFeedbackComment, res => appendReply(res.comment), writes.track,
        "There was an error posting that reply"
    )
    const { execute: updateComment } = useApiActionState(
        FeedbackService.updateFeedbackComment, res => replaceReply(res.comment), writes.track,
        "There was an error saving that reply"
    )
    const { execute: deleteComment } = useApiActionState(
        FeedbackService.deleteFeedbackComment, dropReply, writes.track,
        "There was an error deleting that reply"
    )

    return {
        comments,
        loading,
        loadedId,
        saving: writes.saving,
        pendingId: writes.pendingId,
        create: (comment: string, done?: () => void) => {
            if (feedbackId === null) return
            writes.begin(null, done)
            createComment(feedbackId, { comment })
        },
        update: (commentId: number, comment: string, done?: () => void) => {
            writes.begin(commentId, done)
            updateComment(commentId, { comment })
        },
        // No UI reaches this yet — replies can be edited but not deleted. Kept in step
        // with the route that is still there, so putting the control back is a one-liner.
        remove: (commentId: number) => {
            writes.begin(commentId)
            deleteComment(commentId)
        },
    }
}
