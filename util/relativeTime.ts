/**
 * The backend stores timestamps as naive UTC (Postgres `now()` on a UTC server), so they
 * serialize without an offset. JavaScript reads an offset-less date-time as *local* time,
 * which would date a just-posted idea hours into the past. Assume UTC unless told otherwise.
 */
export function parseServerTime(value: string): number {
    // Postgres hands back microseconds; the Date Time String Format defines three
    // fractional digits and Hermes holds to that, so the extras are trimmed rather
    // than left to produce an Invalid Date on device.
    const trimmed = value.replace(/(\.\d{3})\d+/, "$1")
    const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(trimmed)
    return Date.parse(hasZone ? trimmed : `${trimmed}Z`)
}

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Short relative age — "just now", "4h", "3d" — for timestamps beside a name. */
export function relativeTime(value: string, now: number = Date.now()): string {
    const elapsed = now - parseServerTime(value)

    if (elapsed < MINUTE) return "just now"
    if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m`
    if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h`
    if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)}d`

    return new Date(parseServerTime(value)).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
    })
}
