import React, { useEffect, useRef, useState } from "react"
import { PickResponseData, SlateType } from "@/api"
import SlateLinesModal from "./modals/SlateLinesModal"
import PickEditorModal from "./modals/PickEditorModal"
import { PickPrefill } from "./PickEditor"

/** The two ways to enter a pick, either of which can hand off to the other. */
export type PickEntrySurface = "browse" | "edit"

/**
 * Long enough to outlast either sheet's dismissal, and harmless when onDismiss beats it
 * there — whichever arrives first promotes, and the other finds nothing left to do.
 */
const HANDOFF_FALLBACK_MS = 450

type Props = {
    /** Which surface to open on, or null while the flow is closed. */
    open: PickEntrySurface | null
    /** The slate whose lines are on offer — the lay's own competition date. */
    date: string
    slateType: SlateType
    parlayId: number
    gamblerId: number
    /** The pick being edited, or null when one is being made. */
    pick: PickResponseData | null
    onClose: () => void
    onPickSaved: () => void
}

/**
 * Entering a pick, by browsing the book's lines or by typing it out.
 *
 * The two are one flow rather than two features: you arrive wanting a bet, not wanting a
 * particular way of describing one, and either surface can hand you to the other without
 * losing the attempt. Which one opens first is only a guess at what you meant — adding a
 * pick opens the board, editing one opens what you already wrote.
 *
 * It exists as a component because the hand-off is the hard part and it should only be
 * written once. iOS will not present a modal while another is still dismissing; it declines
 * silently, leaving nothing on screen and no error to explain it. So a switch cannot set
 * both at once — the outgoing sheet has to be told to go, and only once it has actually
 * gone can the next be asked to appear. Three call sites doing that by hand is three
 * chances to get it subtly wrong.
 */
export default function PickEntryFlow({
    open, date, slateType, parlayId, gamblerId, pick, onClose, onPickSaved,
}: Props) {
    // What is actually on screen, which is not the same as what the caller asked for: it
    // goes briefly to null in the middle of every hand-off.
    const [surface, setSurface] = useState<PickEntrySurface | null>(null)
    // Where to go once the current sheet has finished leaving. A ref because it is a baton
    // passed between callbacks rather than something rendered, and because it has to be
    // readable the instant it is set.
    const queued = useRef<PickEntrySurface | null>(null)
    // A line chosen from the board, which outranks the existing pick in the editor — that
    // is what makes browsing from an edit a replacement rather than an addition.
    const [prefill, setPrefill] = useState<PickPrefill | null>(null)
    // Held so it can be cancelled: a hand-off in flight when the card unmounts would
    // otherwise fire into nothing.
    const fallback = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => () => {
        if (fallback.current) clearTimeout(fallback.current)
    }, [])

    useEffect(() => {
        if (open === null) {
            setSurface(null)
            queued.current = null
            // Cleared on the way out, so a line browsed and abandoned does not reappear as
            // the starting point the next time the editor is opened.
            setPrefill(null)
            return
        }
        setSurface(open)
    }, [open])

    /**
     * Promotes the queued surface, once only.
     *
     * Called from both a dismissal and a timer, and safe to call when nothing is waiting —
     * every close runs through here too, and finds the baton already dropped.
     */
    function promoteQueued() {
        const next = queued.current
        if (!next) return
        queued.current = null
        setSurface(next)
    }

    /** Sends the current sheet away and brings the other one back in its place. */
    function handOffTo(next: PickEntrySurface) {
        queued.current = next
        setSurface(null)
        if (fallback.current) clearTimeout(fallback.current)
        fallback.current = setTimeout(promoteQueued, HANDOFF_FALLBACK_MS)
    }

    function close() {
        queued.current = null
        setSurface(null)
        onClose()
    }

    return (
        <>
            <SlateLinesModal
                visible={surface === "browse"}
                date={date}
                slateType={slateType}
                onClose={close}
                onSelect={selected => {
                    setPrefill(selected)
                    handOffTo("edit")
                }}
                // Typing it out is always available, because the board is a convenience and
                // not a gate: a bet the book has not priced is still a bet you can make.
                onEnterManually={() => {
                    setPrefill(null)
                    handOffTo("edit")
                }}
                onDismissed={promoteQueued}
            />

            <PickEditorModal
                visible={surface === "edit"}
                pick={pick}
                prefill={prefill}
                parlayId={parlayId}
                gamblerId={gamblerId}
                onClose={close}
                onPickSaved={onPickSaved}
                onBrowseLines={() => handOffTo("browse")}
                onDismissed={promoteQueued}
            />
        </>
    )
}
