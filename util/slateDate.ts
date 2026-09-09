/**
 * Reading a competition date as the day it names.
 *
 * The API sends these as plain calendar dates — "2026-09-14", no time and no zone —
 * because that is what they are: a slate is a day, not an instant. JavaScript disagrees.
 * `new Date("2026-09-14")` is specified to parse a bare date as UTC midnight, and every
 * getter then reads it back in local time, so west of Greenwich it lands on the evening of
 * the day before. Read that way, a Monday lay called itself Sunday and a Sunday lay called
 * itself Saturday — the whole app was a day early, and a lay's own card disagreed with the
 * slate its line browser loaded.
 *
 * These parse the parts by hand and build a local date, so the day that comes out is the
 * day that went in.
 */

/** "2026-09-14" as that calendar day at local midnight, or null if it is not a date. */
export function parseSlateDate(date: string | null | undefined): Date | null {
    if (!date) return null
    const [year, month, day] = date.split("-").map(Number)
    if (!year || !month || !day) return null
    return new Date(year, month - 1, day)
}

/** "Mon, Sep 14" — the weekday first, because that is what makes a wrong date obvious. */
export function slateDateLabel(date: string | null | undefined): string {
    const parsed = parseSlateDate(date)
    if (!parsed) return date ?? ""
    return parsed.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
}

/** "09/14" — the compact form the lay cards use. */
export function slateDateShort(date: string | null | undefined): string {
    const parsed = parseSlateDate(date)
    if (!parsed) return date ?? ""
    const day = parsed.getDate().toString().padStart(2, "0")
    const month = (parsed.getMonth() + 1).toString().padStart(2, "0")
    return `${month}/${day}`
}
