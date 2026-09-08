import { useCallback, useEffect, useRef, useState } from "react"
import { AppState } from "react-native"
import useApiActionState from "./useApiActionState"
import useWriteState from "./useWriteState"
import { parseServerTime } from "@/util/relativeTime"

/**
 * How often an open drawer looks for replies that landed while it has been open.
 *
 * Slow enough that an idle thread costs almost nothing, quick enough that a back-and-forth
 * reads as a conversation rather than a page you have to reload.
 */
export const THREAD_POLL_INTERVAL_MS = 5_000

/**
 * A reply, stripped of whatever it hangs off.
 *
 * Feedback comments and pick comments come back field for field alike, so the thread UI is
 * given this instead of either — and deliberately carries no parent id, since the
 * controller already knows its target. That leaves the two adapters structurally identical.
 */
export type ThreadComment = {
    id: number
    authorName: string
    comment: string
    createdAt: string
    viewerIsAuthor: boolean
}

/** Everything CommentThread needs to render and to write, whatever it is a thread on. */
export type ThreadController = {
    comments: ThreadComment[]
    loading: boolean
    /**
     * Which target the replies in hand belong to. An empty list means nothing until this
     * matches: before the first response it is the placeholder, not a reply count.
     */
    loadedId: number | null
    saving: boolean
    pendingId: number | null
    create: (comment: string, done?: () => void) => void
    update: (commentId: number, comment: string, done?: () => void) => void
    remove: (commentId: number, done?: () => void) => void
}

export type CommentThreadConfig<T> = {
    /** The feedback or pick the thread belongs to; null when nothing is open. */
    targetId: number | null
    list: (targetId: number) => Promise<T[]>
    create: (targetId: number, comment: string) => Promise<T>
    update: (commentId: number, comment: string) => Promise<T>
    remove: (commentId: number) => Promise<unknown>
    toThreadComment: (raw: T) => ThreadComment
    /**
     * How often to look for replies that arrived while the drawer has been open. Omitted,
     * nothing polls.
     */
    pollIntervalMs?: number
    /**
     * One request per tick, returning only replies newer than `after`. Anything else the
     * response carries — a pick's reactions — is the caller's business to apply on the way
     * through, which is what keeps this hook ignorant of what it is a thread on.
     */
    poll?: (targetId: number, after: string | undefined) => Promise<T[]>
    /**
     * Hold the poll while something outside this hook is writing. Without it a tick landing
     * mid-write answers with the state from before it, and the drawer flickers backwards.
     */
    pausePolling?: boolean
}

/**
 * One thread, loaded when its target opens and optionally kept live while it stays open.
 *
 * Replies are fetched here rather than with the list they belong to: most threads are never
 * opened and the card only needs the count. Every write returns the reply it changed, so
 * the thread is patched in place and no reply costs a second round trip.
 */
export default function useCommentThread<T>(config: CommentThreadConfig<T>): ThreadController {
    const { targetId, toThreadComment } = config

    const [comments, setComments] = useState<ThreadComment[]>([])
    const [loading, setLoading] = useState(false)
    const [loadedId, setLoadedId] = useState<number | null>(null)
    const requestedId = useRef<number | null>(null)
    const writes = useWriteState()

    // Read by the interval, which is set up once and must not be torn down and rebuilt
    // every time a reply lands — so what it needs is held in refs rather than closed over.
    const latest = useRef({ comments, loadedId, saving: writes.saving, config })
    latest.current = { comments, loadedId, saving: writes.saving, config }

    const { execute: load } = useApiActionState(
        config.list,
        (raw: T[]) => {
            setComments(raw.map(toThreadComment))
            setLoadedId(requestedId.current)
        },
        setLoading,
        "There was an error loading replies",
        { retryable: true }
    )

    const reload = useCallback(() => {
        if (targetId === null) return
        requestedId.current = targetId
        load(targetId)
    }, [targetId]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        // Cleared first so opening a second target never flashes the first one's replies.
        setComments([])
        setLoadedId(null)
        reload()
    }, [reload])

    /**
     * New replies onto the end, ignoring any already held.
     *
     * The dedupe is load-bearing rather than defensive: posting a reply appends it from the
     * POST response, and a poll already in flight returns that same reply a moment later.
     *
     * The same array back when nothing is new, so an idle thread does not re-render the
     * drawer every few seconds for no reason.
     */
    function appendNew(incoming: ThreadComment[]) {
        if (incoming.length === 0) return
        setComments(current => {
            const known = new Set(current.map(c => c.id))
            const fresh = incoming.filter(c => !known.has(c.id))
            return fresh.length === 0 ? current : [...current, ...fresh]
        })
    }

    useEffect(() => {
        const interval = config.pollIntervalMs
        if (targetId === null || !interval || !config.poll) return

        // Cancelled on teardown and checked before anything is scheduled or applied. A
        // request in flight when the drawer closes still resolves — nothing can abort it
        // once sent — but it lands on this, applies nothing and arms nothing, so it retires
        // quietly rather than restarting the chain behind a closed drawer.
        let cancelled = false
        let timer: ReturnType<typeof setTimeout> | undefined

        function schedule() {
            if (cancelled) return
            timer = setTimeout(run, interval)
        }

        function run() {
            const { comments, loadedId, saving, config } = latest.current

            // Re-armed rather than returned: a check skipped for any of these must not be
            // the end of the chain, or the drawer would go quiet for as long as it stays open.
            const skip =
                saving                              // a write of this thread's own is landing
                || config.pausePolling              // something outside it is mid-write
                || loadedId !== targetId            // no honest cursor until the first load
                || AppState.currentState !== "active"  // nobody is looking
                || !config.poll
            if (skip) {
                schedule()
                return
            }

            // The newest reply held, by time rather than by position: the thread is
            // oldest-first and append-only today, but taking the max does not quietly
            // break if that ever stops being true. Empty means there is no cursor yet, so
            // the tick asks for the whole thread — which is what makes "you opened an
            // empty thread and someone replied" work.
            const cursor = comments.reduce<string | undefined>((newest, c) => (
                newest === undefined || parseServerTime(c.createdAt) > parseServerTime(newest)
                    ? c.createdAt
                    : newest
            ), undefined)

            // Deliberately not useApiActionState: a background refresh must not raise the
            // thread's loader, and must fail silently — a flaky connection would otherwise
            // toast every few seconds over a drawer someone is still typing in.
            config.poll!(targetId!, cursor)
                .then(raw => { if (!cancelled) appendNew(raw.map(config.toThreadComment)) })
                .catch(() => {})
                // Chained off the response rather than run on a fixed interval, so the gap
                // is real rest. On a slow connection a fixed rate measures the gap from the
                // *start* of the last request, which collapses to near-continuous polling
                // exactly when the network can least afford it. This also makes the chain
                // serial by construction, so nothing can stack up.
                .finally(schedule)
        }

        schedule()
        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [targetId, config.pollIntervalMs]) // eslint-disable-line react-hooks/exhaustive-deps

    function replaceReply(updated: ThreadComment) {
        setComments(current => current.map(c => (c.id === updated.id ? updated : c)))
        writes.finish()
    }

    function dropReply() {
        setComments(current => current.filter(c => c.id !== writes.target.current))
        writes.finish()
    }

    const { execute: createComment } = useApiActionState(
        config.create,
        (raw: T) => {
            // The thread is oldest-first, so a new reply belongs on the end — right above
            // the box it was typed in.
            appendNew([toThreadComment(raw)])
            writes.finish()
        },
        writes.track,
        "There was an error posting that reply"
    )
    const { execute: updateComment } = useApiActionState(
        config.update, (raw: T) => replaceReply(toThreadComment(raw)), writes.track,
        "There was an error saving that reply"
    )
    const { execute: deleteComment } = useApiActionState(
        config.remove, dropReply, writes.track,
        "There was an error deleting that reply"
    )

    return {
        comments,
        loading,
        loadedId,
        saving: writes.saving,
        pendingId: writes.pendingId,
        create: (comment, done) => {
            if (targetId === null) return
            writes.begin(null, done)
            createComment(targetId, comment)
        },
        update: (commentId, comment, done) => {
            writes.begin(commentId, done)
            updateComment(commentId, comment)
        },
        remove: (commentId, done) => {
            writes.begin(commentId, done)
            deleteComment(commentId)
        },
    }
}
