/**
 * Matching a sportsbook's name for a player against ESPN's.
 *
 * The two are separate universes with no shared identifier, so the name is the only
 * bridge — and they disagree about it constantly. Measured across a slate's worth of
 * lines, 47 of 555 names failed a straight comparison: most because one side carries a
 * generational suffix or punctuation the other drops, a few because the book is simply
 * spelling it differently.
 */

/**
 * Suffixes that are part of a name on one side and absent on the other — Chris Godwin is
 * "Chris Godwin Jr." to ESPN, Deebo Samuel is "Deebo Samuel Sr.", David Sills is "David
 * Sills V". Nobody means a different player by it.
 */
const SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv", "v"])

/**
 * A name reduced to what both sources agree on.
 *
 * Punctuation goes because "A.J. Dillon" and "AJ Dillon" are one person, as are "De'Von
 * Achane" and "Devon Achane". Suffixes go for the same reason. What is deliberately left
 * alone is anything that changes which name it is: "Drew Ogletree" does not become
 * "Andrew Ogletree", and "Jacory Croskey-Merritt" does not become "Jacory Merritt" —
 * those are judgements for a person to make, not a string function.
 */
export function normalizeName(name: string): string {
    const tokens = name
        .toLowerCase()
        .replace(/[.'’`]/g, "")
        .replace(/-/g, " ")
        .split(/\s+/)
        .filter(Boolean)

    // Only from the end, and never down to a bare surname.
    while (tokens.length > 2 && SUFFIXES.has(tokens[tokens.length - 1])) {
        tokens.pop()
    }
    return tokens.join(" ")
}

/** Whether two spellings are the same person as far as anything here can tell. */
export function namesMatch(a: string, b: string): boolean {
    return normalizeName(a) === normalizeName(b)
}

/**
 * Narrower searches to try when the full name finds nobody at all.
 *
 * Surname first: it is the half a book is most likely to have right, and it recovered
 * seven of the eight names on a real slate that returned nothing. The eighth was the one
 * that prompted all this — a book spelling "Okonkwo" as "Okonokwo", where the surname
 * search fails and the forename is what finds him.
 *
 * These widen what a person is offered to choose from. They must never resolve a pick on
 * their own: a search for "Sims" answers with every Sims in the league, and quietly
 * attributing a bet to one of them is the failure this whole path exists to avoid.
 */
export function fallbackSearchTerms(name: string): string[] {
    const tokens = name.split(/\s+/).filter(Boolean)
    if (tokens.length < 2) return []

    const surname = tokens[tokens.length - 1]
    const forename = tokens[0]
    // Two letters is not a search, it is every player whose name starts that way.
    return [surname, forename].filter(t => t.replace(/[.'’`-]/g, "").length >= 3)
}
