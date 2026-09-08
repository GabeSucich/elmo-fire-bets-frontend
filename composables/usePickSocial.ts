import { useRef, useState } from "react"
import { PickCommentResponseData, PickReactionResponseData, PickResponseData, PickSocialService } from "@/api"
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import { useToastContext } from "@/contexts/toastContext"
import { setApiErrorMsg } from "@/util/error"
import useCommentThread, { THREAD_POLL_INTERVAL_MS, ThreadComment } from "./useCommentThread"

/** A pick's replies, in the shape the shared thread renders. */
const toThreadComment = (c: PickCommentResponseData): ThreadComment => ({
    id: c.id,
    authorName: c.author_name,
    comment: c.comment,
    createdAt: c.created_at,
    viewerIsAuthor: c.viewer_is_author,
})

/** The emoji one gambler has left on a pick, in the order they are grouped. */
export function myEmoji(reactions: PickReactionResponseData[], gamblerId: number): string[] {
    return reactions.filter(r => r.gambler_ids.includes(gamblerId)).map(r => r.emoji)
}

/** Whether two reaction summaries say the same thing. */
export function sameReactions(a: PickReactionResponseData[], b: PickReactionResponseData[]): boolean {
    if (a.length !== b.length) return false
    return a.every((left, i) => {
        const right = b[i]
        return left.emoji === right.emoji
            && left.gambler_ids.length === right.gambler_ids.length
            && left.gambler_ids.every((id, j) => id === right.gambler_ids[j])
    })
}

/**
 * One emoji on or off a pick, as the server would leave it.
 *
 * Its own inverse, which is what lets a failed write be undone by applying it again rather
 * than by restoring a snapshot. That matters with the drawer polling: a snapshot taken
 * before the request would, on the way back, wipe out any reaction that streamed in while
 * it was in flight. This only ever touches the one emoji and the one gambler.
 *
 * Kept in palette order, which is the order the server groups in — so the optimistic result
 * is the same array the response carries and the chips never visibly settle.
 */
function toggleReaction(
    reactions: PickReactionResponseData[], emoji: string, gamblerId: number, palette: string[],
): PickReactionResponseData[] {
    const existing = reactions.find(r => r.emoji === emoji)

    let next: PickReactionResponseData[]
    if (!existing) {
        next = [...reactions, { emoji, gambler_ids: [gamblerId] }]
    } else if (!existing.gambler_ids.includes(gamblerId)) {
        next = reactions.map(r => r.emoji === emoji
            ? { ...r, gambler_ids: [...r.gambler_ids, gamblerId] }
            : r)
    } else {
        const remaining = existing.gambler_ids.filter(id => id !== gamblerId)
        // The last one off takes the chip with it, the same way the server stops grouping it.
        next = remaining.length === 0
            ? reactions.filter(r => r.emoji !== emoji)
            : reactions.map(r => r.emoji === emoji ? { ...r, gambler_ids: remaining } : r)
    }

    // Anything no longer in the palette sorts after it, and a stable sort leaves those in
    // the order they arrived — matching how the server ranks them.
    const rank = (e: string) => {
        const i = palette.indexOf(e)
        return i === -1 ? palette.length : i
    }
    return next.slice().sort((a, b) => rank(a.emoji) - rank(b.emoji))
}

/**
 * Toggling one emoji on one pick, applied before the server has heard about it.
 *
 * A reaction is a tap, and a tap that waits on a round trip to show anything reads as a
 * missed tap — so the chip moves immediately and is put back only if the write actually
 * fails. Nothing here shows a spinner: the chip *is* the feedback.
 *
 * Deliberately not useApiActionState, which has no failure hook — it toasts and swallows,
 * and this needs to undo as well as tell you.
 */
export function usePickReactions(
    patchPick: (change: (pick: PickResponseData) => PickResponseData) => void,
) {
    const { gamblerId, reactionPalette } = useGamblingSeasonContext()
    const { showToast } = useToastContext()
    const [saving, setSaving] = useState(false)
    // Taps land faster than round trips. Only the newest response is authoritative: an
    // earlier one arriving late would otherwise undo the tap that overtook it.
    const latestWrite = useRef(0)
    const inFlight = useRef(0)

    function apply(emoji: string) {
        patchPick(pick => ({
            ...pick,
            reactions: toggleReaction(pick.reactions, emoji, gamblerId, reactionPalette),
        }))
    }

    function toggle(pickId: number, emoji: string) {
        const writeId = ++latestWrite.current
        inFlight.current += 1
        setSaving(true)
        apply(emoji)

        PickSocialService.reactToPick(pickId, { emoji })
            .then(res => {
                // Stale responses are dropped rather than applied. The optimistic state
                // already matches what the newest tap asked for.
                if (writeId === latestWrite.current) patchPick(() => res.pick)
            })
            .catch(e => {
                if (writeId === latestWrite.current) apply(emoji)
                setApiErrorMsg(e, message => showToast(message), "There was an error saving that reaction")
            })
            .finally(() => {
                inFlight.current -= 1
                if (inFlight.current === 0) setSaving(false)
            })
    }

    return { saving, toggle }
}

type PickCommentsOptions = {
    /**
     * Called with the pick's current reactions on every poll.
     *
     * Reactions ride along with the replies rather than on a timer of their own: one
     * request per tick, and one set of guards around it. They come back whole rather than
     * from a cursor because a reaction can be taken back, and no query over insertions can
     * ever show a removal.
     */
    onReactions: (reactions: PickReactionResponseData[]) => void
    /** Held while a reaction toggle is in flight — see CommentThreadConfig.pausePolling. */
    pausePolling?: boolean
}

/** One pick's thread, kept live while its drawer is open. */
export function usePickComments(pickId: number | null, options: PickCommentsOptions) {
    return useCommentThread({
        targetId: pickId,
        list: id => PickSocialService.listPickComments(id).then(res => {
            options.onReactions(res.reactions)
            return res.comments
        }),
        create: (id, comment) => PickSocialService.createPickComment(id, { comment }).then(res => res.comment),
        update: (commentId, comment) => PickSocialService.updatePickComment(commentId, { comment }).then(res => res.comment),
        remove: commentId => PickSocialService.deletePickComment(commentId),
        toThreadComment,
        pollIntervalMs: THREAD_POLL_INTERVAL_MS,
        poll: (id, after) => PickSocialService.listPickComments(id, after).then(res => {
            options.onReactions(res.reactions)
            return res.comments
        }),
        pausePolling: options.pausePolling,
    })
}
