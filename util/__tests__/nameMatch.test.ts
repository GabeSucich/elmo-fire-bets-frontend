import assert from "node:assert/strict"
import test from "node:test"

import { fallbackSearchTerms, namesMatch, normalizeName } from "@/util/nameMatch"

/**
 * Every pair below was taken from a real slate: the left is what the sportsbook published,
 * the right is what ESPN's search returned for it.
 */
test("a generational suffix on one side only is the same player", () => {
    for (const [book, espn] of [
        ["Chris Godwin", "Chris Godwin Jr."],
        ["Deebo Samuel", "Deebo Samuel Sr."],
        ["David Sills", "David Sills V"],
        ["Calvin Austin", "Calvin Austin III"],
        ["Brian Robinson", "Brian Robinson Jr."],
        ["Harold Fannin", "Harold Fannin Jr."],
    ]) {
        assert.ok(namesMatch(book, espn), `${book} / ${espn}`)
    }
})

test("punctuation is not a difference of identity", () => {
    assert.ok(namesMatch("A.J. Dillon", "AJ Dillon"))
    assert.ok(namesMatch("Devon Achane", "De'Von Achane"))
    assert.ok(namesMatch("Dont'e Thornton", "Dont'e Thornton Jr."))
})

test("a different name is left as a different name", () => {
    // A nickname and a hyphenated surname are judgements for a person, not a comparison.
    assert.ok(!namesMatch("Andrew Ogletree", "Drew Ogletree"))
    assert.ok(!namesMatch("Jacory Merritt", "Jacory Croskey-Merritt"))
    assert.ok(!namesMatch("Cameron Ward", "Cam Ward"))
    assert.ok(!namesMatch("Chigoziem Okonokwo", "Chig Okonkwo"))
})

test("two different players never collapse into one", () => {
    assert.ok(!namesMatch("Steven Sims", "Cam Sims"))
    assert.ok(!namesMatch("Aaron Jones", "Aaron Rodgers"))
})

test("a surname is never stripped down to nothing", () => {
    assert.equal(normalizeName("Sills V"), "sills v")
    assert.equal(normalizeName("David Sills V"), "david sills")
})

test("the surname is offered before the forename", () => {
    assert.deepEqual(fallbackSearchTerms("Chigoziem Okonokwo"), ["Okonokwo", "Chigoziem"])
})

test("a fragment too short to search with is not offered", () => {
    // "A.J." reduces to two letters, which answers with every player it prefixes.
    assert.deepEqual(fallbackSearchTerms("A.J. Dillon"), ["Dillon"])
})

test("a single-word name has nothing narrower to try", () => {
    assert.deepEqual(fallbackSearchTerms("Ronaldo"), [])
})
