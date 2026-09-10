import { PropBetDirection, PropBetType, SeasonPickKind } from "@/api"
import { colors } from "@/theme/colors"

/**
 * 18 weeks in the season, but each team only plays 17 games.
 *
 * Everything here is measured in team games elapsed rather than games the player turned
 * out for. A player who missed three games is three games behind the season, not three
 * games short of a shorter one — counting appearances would flatter them on both the
 * pace and the rate they still need.
 */
export const GAMES_PER_SEASON = 17

export type Pace = {
    /** Share of the line reached so far, 0.3 for 330 of 1100. */
    toGoal: number
    /** toGoal divided by the share of the season played: 30% of the line at 20% of the
     *  season is 1.5, meaning one and a half times the rate the line needs. */
    index: number
}

export function calculatePace(total: number, line: number, gamesElapsed: number): Pace | null {
    // Undefined before anyone has played, and a zero line has no goal to be a share of.
    if (gamesElapsed <= 0 || line <= 0) return null
    const toGoal = total / line
    return { toGoal, index: toGoal / (gamesElapsed / GAMES_PER_SEASON) }
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

export type Requirement = {
    /** Stat still to come: what an over must add, or the most an under can afford. */
    remaining: number
    /** That figure per remaining game, stated as a bound the average has to satisfy —
     *  an over must meet it, an under must stay strictly below it. */
    perGame: number
    /** True for an over. */
    atLeast: boolean
}

/** Stats that move in half increments: a sack can be shared, and a tie is half a win. */
const HALF_STEP: ReadonlySet<PropBetType> = new Set([PropBetType.SACKS])

/** The smallest amount a stat can actually move by. */
function gridStep(kind: SeasonPickKind, propType: PropBetType | null): number {
    if (kind === SeasonPickKind.TEAM_WINS) return 0.5
    return propType !== null && HALF_STEP.has(propType) ? 0.5 : 1
}

// Lines land on the grid often enough — 9.5 wins, 15.5 sacks — that the comparisons
// below have to survive a float that is a hair either side of it.
const EPSILON = 1e-9

/**
 * The rest of the season, as a number someone can actually act on.
 *
 * A line is not the target: stats come in whole units, so beating 10.5 means reaching
 * 11, and staying under it means stopping at 10. Rounding to the line instead quietly
 * understates an over by most of a unit — the gap that makes "0.4 per game" out of a
 * bet that really needs 0.5.
 *
 * Null once the answer stops being useful: no games left, an over already clear of the
 * line, or an under already past saving.
 */
export function calculateRequirement(
    total: number,
    line: number,
    gamesElapsed: number,
    direction: PropBetDirection,
    kind: SeasonPickKind,
    propType: PropBetType | null,
): Requirement | null {
    const gamesLeft = GAMES_PER_SEASON - gamesElapsed
    if (gamesLeft <= 0) return null

    const step = gridStep(kind, propType)
    // The lowest reachable total that beats the line, and the highest that stays short.
    const over = Math.floor(line / step + EPSILON) * step + step
    const under = Math.ceil(line / step - EPSILON) * step - step

    const isOver = direction === PropBetDirection.OVER
    const remaining = (isOver ? over : under) - total
    // An under is phrased against the total one step further on, so "less than" reads as
    // a bound the average must stay strictly below rather than one it may equal.
    const perGame = ((isOver ? over : under + step) - total) / gamesLeft

    // An over with nothing left to add has already cleared. An under can legitimately
    // have exactly nothing left to spend and still be live, so only a deficit kills it.
    if (isOver ? remaining <= 0 : remaining < 0) return null

    return { remaining, perGame, atLeast: isOver }
}
