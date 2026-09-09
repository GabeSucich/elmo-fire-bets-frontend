import { useEffect, useState } from "react"
import { OddsService, PlayerLinesResponseData, SlateType } from "@/api"
import useApiActionState from "./useApiActionState"

/**
 * Sportsbook lines for the games on one date.
 *
 * The date is the parlay's own competition date, which is both how the provider filters
 * and how billing works — pulling a Thursday costs one game rather than the surrounding
 * week's fifteen. The server holds each date for a quarter of an hour, so opening this
 * repeatedly, or five people opening it at once, costs one fetch rather than five.
 */
export function useSlateLines(date: string | null) {
    const [players, setPlayers] = useState<PlayerLinesResponseData[]>([])
    const [fetchedAt, setFetchedAt] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    // Separated from an empty list, which is a real answer: a date with no games, one too
    // far out to be priced, or a slate already played all come back empty and are not
    // failures. Only this says whether an answer has arrived at all.
    const [loaded, setLoaded] = useState(false)

    const { execute: load } = useApiActionState(
        OddsService.getSlateLines,
        response => {
            setPlayers(response.players)
            setFetchedAt(response.fetched_at)
            setLoaded(true)
        },
        setLoading,
        "There was an error loading lines",
        { retryable: true }
    )

    useEffect(() => {
        if (date === null) return
        setPlayers([])
        setLoaded(false)
        load(date)
    }, [date]) // eslint-disable-line react-hooks/exhaustive-deps

    return { players, fetchedAt, loading, loaded }
}

/** Punctuation- and case-insensitive, so "aj" finds "A.J. Brown" and "deebo" finds Deebo. */
function normalise(value: string) {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

/** Matches a player by name, team, or the game they are in. An empty term matches all. */
export function matchesPlayer(player: PlayerLinesResponseData, term: string): boolean {
    const t = normalise(term)
    if (!t) return true
    return normalise(player.name).includes(t)
        || normalise(player.team ?? "").includes(t)
        || normalise(player.matchup ?? "").includes(t)
}

/** Whether a prop type reads as what was typed — "rec" finds Rec Yards and Receptions. */
export function matchesProp(propType: string, term: string): boolean {
    const t = normalise(term)
    return !t || normalise(propType).includes(t)
}

/**
 * Kickoff in the league's own timezone.
 *
 * Fixed to Pacific rather than the device's: everyone here talks about a slate in the same
 * clock, and a phone left on another timezone would quietly relabel every game. Degrades to
 * nothing rather than throwing if the runtime lacks timezone data.
 */
export function kickoffLabel(startsAt: string | null | undefined): string | null {
    if (!startsAt) return null
    try {
        return new Date(startsAt).toLocaleTimeString("en-US", {
            timeZone: "America/Los_Angeles",
            hour: "numeric",
            minute: "2-digit",
        }) + " PT"
    } catch {
        return null
    }
}


/**
 * The parts of a slate people actually talk about.
 *
 * Boundaries are in Pacific and deliberately odd — 9:50 rather than 10:00 — because they
 * are drawn just before the kickoffs they group, so a game listed at 10:00 lands in the
 * window named after it rather than the one before.
 */
export const SLATE_WINDOWS = ["Early morning", "Morning", "Afternoon", "Evening"] as const
export type SlateWindow = typeof SLATE_WINDOWS[number]

/** Minutes past midnight Pacific at which each window ends; the last one runs to the day's end. */
const WINDOW_ENDS: [SlateWindow, number][] = [
    ["Early morning", 9 * 60 + 50],
    ["Morning", 12 * 60 + 50],
    ["Afternoon", 15 * 60 + 30],
    ["Evening", 24 * 60],
]

/** Minutes past midnight Pacific, or null if the runtime cannot tell us. */
function pacificMinutes(startsAt: string): number | null {
    try {
        const parts = new Intl.DateTimeFormat("en-US", {
            timeZone: "America/Los_Angeles",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).formatToParts(new Date(startsAt))
        const hour = Number(parts.find(p => p.type === "hour")?.value)
        const minute = Number(parts.find(p => p.type === "minute")?.value)
        if (Number.isNaN(hour) || Number.isNaN(minute)) return null
        // Midnight comes back as 24 from some implementations.
        return (hour % 24) * 60 + minute
    } catch {
        return null
    }
}

/** Which part of the day a game kicks off in, or null if it has no start time. */
export function slateWindowOf(startsAt: string | null | undefined): SlateWindow | null {
    if (!startsAt) return null
    const minutes = pacificMinutes(startsAt)
    if (minutes === null) return null
    for (const [window, end] of WINDOW_ENDS) {
        if (minutes < end) return window
    }
    return "Evening"
}


/**
 * The window a slate type implies, where it implies one.
 *
 * A parlay already says which part of the day it is for, so opening the lines for it
 * should not start by asking again. Null means the slate genuinely spans windows and
 * guessing would hide most of the board — Thanksgiving runs 9:30am, 1:30pm and 5:20pm, and
 * a playoff weekend is afternoon and evening both.
 */
const SLATE_TYPE_WINDOW: Partial<Record<SlateType, SlateWindow>> = {
    [SlateType.TNF]: "Evening",
    [SlateType.FNF]: "Evening",
    [SlateType.WNF]: "Evening",
    [SlateType.SNF]: "Evening",
    [SlateType.MNF]: "Evening",
    [SlateType.SATURDAY]: "Evening",
    [SlateType.MORNING_SLATE]: "Morning",
    [SlateType.AFTERNOON_SLATE]: "Afternoon",
    // International games are deliberately absent alongside TD, Xmas and the playoff
    // rounds: London kicks off early but Munich, São Paulo and a Sunday-night international
    // do not, so the name says where a game is rather than when.
}

export function windowForSlateType(slateType: SlateType | null | undefined): SlateWindow | null {
    return (slateType && SLATE_TYPE_WINDOW[slateType]) ?? null
}
