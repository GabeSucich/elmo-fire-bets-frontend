/**
 * Number formatting for season pick stats and lines.
 *
 * Both cap at two decimals, which is as fine as any market goes: a 15.75 sacks line is
 * real and must not be rounded to 15.8, but nothing needs a third place.
 */

/** Rounded to two decimals with no trailing zeros: 122, 15.75, 0.5. */
export function formatStat(value: number): string {
    return String(Math.round(value * 100) / 100)
}

/**
 * A betting line, which keeps at least one decimal by convention — a 10.5 reads wrong
 * as 10 — and takes a second only when the line actually uses it.
 */
export function formatLine(value: number): string {
    const rounded = Math.round(value * 100) / 100
    return rounded.toFixed(Number.isInteger(rounded * 10) ? 1 : 2)
}

/**
 * A per-game rate, at one decimal, rounded the way the bet needs it.
 *
 * Nearest is the wrong choice here: 1000 yards over 17 games is 58.82, and showing 58.8
 * states a rate that finishes on 999.6 and loses. An over rounds up and an under rounds
 * down, so following the number on the card always settles the bet the right way.
 *
 * The epsilon keeps a rate that is a float's breadth off a tenth — 0.6999999999999999 —
 * from being pushed a whole tenth by the rounding it is supposed to be exempt from.
 */
export function formatRate(value: number, roundUp: boolean): string {
    const tenths = value * 10
    const snapped = roundUp
        ? Math.ceil(tenths - 1e-9)
        : Math.floor(tenths + 1e-9)
    return (snapped / 10).toFixed(1)
}
