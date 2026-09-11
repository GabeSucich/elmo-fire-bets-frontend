import { ParlayResponseData } from "@/api"

/**
 * Money on a lay.
 *
 * `payout_pp` holds what one person collects if the lay lands, stake included, because
 * that is what a slip prints and storing what you saw beats storing what you worked out.
 * Everything on screen is the other reading — what the lay *made* — so the subtraction
 * happens once, here, rather than at each of the places that show it.
 */

/** Per person, rounded the way it is stored. */
export function perPerson(total: number, pickCount: number): number {
    if (pickCount <= 0) return total
    return Math.round((total / pickCount) * 100) / 100
}

/** What one person walks away up, stake already back in their pocket. */
export function netPerPerson(parlay: ParlayResponseData): number | null {
    if (parlay.payout_pp === null) return null
    return Math.round((parlay.payout_pp - parlay.wager_pp) * 100) / 100
}

/** Whole dollars where it is whole, cents where it is not: $180, $94.50. */
export function money(amount: number): string {
    const rounded = Math.round(amount * 100) / 100
    return `$${Number.isInteger(rounded) ? rounded : rounded.toFixed(2)}`
}
