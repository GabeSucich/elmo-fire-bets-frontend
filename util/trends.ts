import { GamblerPerformance, SetMetrics } from "@/api"

/**
 * Minimum sample before a player or prop can appear in a trend list, counted in
 * DECIDED picks — pushes and voids are excluded from win rate, so letting them
 * count toward the threshold admits entries like "100% on 1 decided pick".
 *
 * Sized against a full season: at 3 decided picks each gambler has 5-13 qualifying
 * players, and at 5 decided picks 4-6 qualifying props.
 *
 * Players get one exception to it, for empty slots only: MIN_PERFECT_TARGET_PICKS.
 */
export const MIN_TARGET_PICKS = 3

/**
 * A spotless record fills a slot the full threshold would leave empty: 2-0 and 0-2 are
 * already a statement about a player, while a 1-1 at the same sample says nothing.
 *
 * These only ever BACKFILL — see backfilled(). Ranking them against longer records by
 * rate alone would put every 2-0 above a 3-1, and a season leaves enough of them to own
 * both lists outright, picked between on nothing better than who was bet first.
 */
export const MIN_PERFECT_TARGET_PICKS = 2

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

/** A record with nothing but wins or nothing but losses in it. */
function perfect(summary: Summary) {
    return summary.winRate === 100 || summary.winRate === 0
}

/** Short enough to need the exception, spotless enough to earn it. */
function backfillCandidate(summary: Summary) {
    return perfect(summary)
        && summary.decided >= MIN_PERFECT_TARGET_PICKS
        && summary.decided < MIN_TARGET_PICKS
}

/**
 * A ranked list, topped up with perfect short records only where it falls short.
 *
 * Two passes rather than one pool, so a 2-0 can never displace an established record:
 * early in a season it fills lists that would read "Not enough data", and by the end,
 * when there are three full-sample entries to show, it drops back out of sight.
 */
function backfilled(summaries: Summary[], rank: (s: Summary[]) => Summary[]): Summary[] {
    const established = rank(qualifying(summaries, MIN_TARGET_PICKS))
    if (established.length >= LIST_SIZE) {
        return established
    }
    const short = rank(summaries.filter(backfillCandidate))
    return [...established, ...short].slice(0, LIST_SIZE)
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
    return Object.entries(prop_targets)
        .map(([targetId, metrics]) =>
            toSummary(targetId, target_names[targetId] ?? `Target ${targetId}`, metrics))
        .filter((s): s is Summary => s !== null)
}

/**
 * The players a gambler is worst on.
 *
 * Called the ban list until the league got a real one — an actual list people put players
 * on by hand, which now owns both that name and the warning mark on a pick. This is a
 * record, not a decision anybody made, so it stays where a record belongs: in Trends.
 */
export function buildIceCold(performance: GamblerPerformance): Summary[] {
    return backfilled(targetSummaries(performance), worstOf)
}

export function buildOlTrusties(performance: GamblerPerformance): Summary[] {
    return backfilled(targetSummaries(performance), bestOf)
}


