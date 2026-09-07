import { PropBetDirection } from "@/api"
import { colors } from "@/theme/colors"

/** 18 weeks in the season, but each team only plays 17 games. */
export const GAMES_PER_SEASON = 17

export type Pace = {
    /** Share of the line reached so far, 0.3 for 330 of 1100. */
    toGoal: number
    /** toGoal divided by the share of the season played: 30% of the line at 20% of the
     *  season is 1.5, meaning one and a half times the rate the line needs. */
    index: number
}

export function calculatePace(total: number, line: number, gamesPlayed: number): Pace | null {
    // Undefined before anyone has played, and a zero line has no goal to be a share of.
    if (gamesPlayed <= 0 || line <= 0) return null
    const toGoal = total / line
    return { toGoal, index: toGoal / (gamesPlayed / GAMES_PER_SEASON) }
}

function lerpChannel(from: number, to: number, t: number) {
    return Math.round(from + (to - from) * t)
}

function lerpHex(from: string, to: string, t: number) {
    const parse = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
    const [fr, fg, fb] = parse(from)
    const [tr, tg, tb] = parse(to)
    const hex = (n: number) => n.toString(16).padStart(2, "0")
    return `#${hex(lerpChannel(fr, tr, t))}${hex(lerpChannel(fg, tg, t))}${hex(lerpChannel(fb, tb, t))}`
}

/**
 * Red through amber to green across the pace index.
 *
 * An index of 1 is exactly on pace and sits at amber; the ends saturate at half and
 * double that rate, past which further extremity says nothing useful. The scale flips
 * for an under, where piling up the stat quickly is the bad outcome.
 */
export function paceColor(index: number, direction: PropBetDirection): string {
    const clamped = Math.max(0, Math.min(2, index))
    const ahead = direction === PropBetDirection.OVER ? clamped / 2 : 1 - clamped / 2

    return ahead < 0.5
        ? lerpHex(colors.danger, colors.warning, ahead / 0.5)
        : lerpHex(colors.warning, colors.success, (ahead - 0.5) / 0.5)
}
