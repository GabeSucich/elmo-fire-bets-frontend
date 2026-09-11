import { PickResponseData, PickResult, PropBetDirection, VetoApprovalStatus } from "@/api"
import { colors } from "@/theme/colors"

/** What the bar should say about a leg, once a sync has read it. */
export type PickProgress = {
    /** Null before kickoff and for a void: there is no number to show. */
    value: number | null
    /** 0-1, for the bar's fill. Always toward the line, whichever way the bet runs. */
    filled: number
    color: string
    /** Shown in place of the value where there is none to show. */
    label: string | null
}

/**
 * The line a pick is actually settled against, and the direction it is actually read in.
 *
 * Both can differ from what the row was created with: a correction rewrites the line, and
 * an approved veto flips the direction without touching `direction` in the database — the
 * same reading `lineAndDirectionDisplay` uses, so the bar and the text agree.
 */
export function effectiveLine(pick: PickResponseData): number {
    return pick.corrected_line ?? pick.line
}

export function effectiveDirection(pick: PickResponseData): PropBetDirection {
    const vetoed = pick.veto?.approval_status === VetoApprovalStatus.APPROVED
    if (!vetoed) return pick.direction
    return pick.direction === PropBetDirection.OVER
        ? PropBetDirection.UNDER
        : PropBetDirection.OVER
}

/**
 * How a synced leg is doing.
 *
 * The colour answers one question: is this still live, already won, or already lost. An
 * over that has cleared can never come back, so it is green the moment it does. An under
 * that has been passed is gone for the same reason. Everything in between is yellow while
 * the game is still being played, and resolves the moment it is not — a finished game is
 * as final as a result somebody typed in, and waiting for the typing would leave a lost
 * bet looking alive for however long nobody got round to it.
 */
export function pickProgress(pick: PickResponseData): PickProgress | null {
    // A void is off the board entirely — most often a player who never took the field,
    // where a zero would read as a bet that lost rather than one that never ran.
    if (pick.result === PickResult.VOID) {
        return { value: null, filled: 0, color: colors.textMuted, label: "Void" }
    }
    if (pick.live_state === null) return null
    if (pick.live_state === "pre") {
        return { value: null, filled: 0, color: colors.textMuted, label: "Yet to start" }
    }

    const value = pick.live_value
    if (value === null) return null

    const line = effectiveLine(pick)
    const isOver = effectiveDirection(pick) === PropBetDirection.OVER
    const cleared = value > line
    // A finished game and a recorded result are the same signal: nothing more can happen.
    const settled = pick.live_state === "post" || pick.result !== null

    // A push is neither, whatever the numbers say — it gets its money back.
    const color = pick.result === PickResult.PUSH
        ? colors.warning
        : isOver
            ? (cleared ? colors.success : settled ? colors.danger : colors.warning)
            : (cleared ? colors.danger : settled ? colors.success : colors.warning)

    return {
        value,
        // Toward the line either way. For an under a full bar is the bad end, which is
        // what the colour beside it is for.
        filled: line > 0 ? Math.max(0, Math.min(1, value / line)) : 0,
        color,
        label: null,
    }
}
