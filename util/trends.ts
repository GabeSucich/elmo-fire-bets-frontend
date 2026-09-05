import { GamblerPerformance, SetMetrics } from "@/api"

/**
 * Minimum sample before a player or prop can appear in a trend list, counted in
 * DECIDED picks — pushes and voids are excluded from win rate, so letting them
 * count toward the threshold admits entries like "100% on 1 decided pick".
 *
 * Sized against a full season: at 3 decided picks each gambler has 5-13 qualifying
 * players, and at 5 decided picks 4-6 qualifying props.
 */
export const MIN_TARGET_PICKS = 3

export const LIST_SIZE = 3

export type Summary = {
    key: string
    name: string
    total: number
    decided: number
    wins: number
    losses: number
    winRate: number
}

/** Pushes and voids are not counted in win_rate, so they don't count as sample either. */
export function decidedPicks(metrics: SetMetrics) {
    return metrics.total - metrics.pushes - metrics.voids
}

export function toSummary(key: string, name: string, metrics: SetMetrics): Summary | null {
    if (metrics.win_rate === null) {
        return null
    }
    return {
        key,
        name,
        total: metrics.total,
        decided: decidedPicks(metrics),
        wins: metrics.wins,
        losses: metrics.losses,
        winRate: metrics.win_rate,
    }
}

export function qualifying(summaries: (Summary | null)[], minPicks: number): Summary[] {
    return summaries.filter((s): s is Summary => s !== null && s.decided >= minPicks)
}

/**
 * Best and worst are split on the 50% line rather than taken from opposite ends of
 * one sorted list. Two things fall out of that: an entry can never appear in both
 * lists (a win rate is not both above and below 50), and a "best" list can never
 * fill itself with losing records when there are fewer than six qualifying entries.
 * Entries sitting exactly at 50% are neither, so they show up in neither list.
 */
export function bestOf(summaries: Summary[]) {
    return summaries
        .filter(s => s.winRate > 50)
        .sort((a, b) => b.winRate - a.winRate || b.decided - a.decided)
        .slice(0, LIST_SIZE)
}

export function worstOf(summaries: Summary[]) {
    return summaries
        .filter(s => s.winRate < 50)
        .sort((a, b) => a.winRate - b.winRate || b.decided - a.decided)
        .slice(0, LIST_SIZE)
}

/** Player trends exclude TD slates: they get their own section. */
function targetSummaries(performance: GamblerPerformance): Summary[] {
    const { prop_targets, target_names } = performance.metrics.non_TD_slate
    const summaries = Object.entries(prop_targets).map(([targetId, metrics]) =>
        toSummary(targetId, target_names[targetId] ?? `Target ${targetId}`, metrics))
    return qualifying(summaries, MIN_TARGET_PICKS)
}

/**
 * The players a gambler is worst on. Shared by the Trends section and the ban-list
 * warning shown against a pick, so the two can never disagree about who is on it.
 */
export function buildBanList(performance: GamblerPerformance): Summary[] {
    return worstOf(targetSummaries(performance))
}

export function buildOlTrusties(performance: GamblerPerformance): Summary[] {
    return bestOf(targetSummaries(performance))
}

export type BanListPlacement = {
    entry: Summary
    /** 1 is the worst record on the list. */
    rank: number
}

/** The ban-list entry for a target, and where it places, if that gambler has one. */
export function findBanListEntry(
    performance: GamblerPerformance | undefined,
    propBetTargetId: number
): BanListPlacement | null {
    if (!performance) return null
    const banList = buildBanList(performance)
    const index = banList.findIndex(entry => entry.key === String(propBetTargetId))
    if (index === -1) return null
    return { entry: banList[index], rank: index + 1 }
}
