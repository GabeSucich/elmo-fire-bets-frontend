import assert from "node:assert/strict"
import test from "node:test"

import { PickResponseData, PickResult, PropBetDirection, VetoApprovalStatus } from "@/api"
import { pickProgress } from "@/util/pickProgress"
import { colors } from "@/theme/colors"

/**
 * A leg, with only the fields the progress rules read.
 *
 * Cast rather than fully built: PickResponseData carries reactions, comments and a target
 * that none of this touches, and spelling them out would bury the one field each case is
 * actually about.
 */
function pick(over: Partial<PickResponseData>): PickResponseData {
    return {
        line: 49.5,
        corrected_line: null,
        direction: PropBetDirection.OVER,
        result: null,
        veto: null,
        live_value: null,
        live_state: null,
        live_detail: null,
        live_synced_at: null,
        ...over,
    } as PickResponseData
}

const OVER = PropBetDirection.OVER
const UNDER = PropBetDirection.UNDER

test("renders nothing until the parlay has been synced", () => {
    assert.equal(pickProgress(pick({ live_state: null })), null)
})

test("a game that has not kicked off shows an empty bar, not a zero", () => {
    const p = pickProgress(pick({ live_state: "pre", live_value: null }))!
    assert.equal(p.label, "Yet to start")
    assert.equal(p.filled, 0)
    assert.equal(p.value, null)
})

test("a void shows as void even once the game is over", () => {
    const p = pickProgress(pick({
        result: PickResult.VOID, live_state: "post", live_value: 80,
    }))!
    assert.equal(p.label, "Void")
    assert.equal(p.value, null)
    assert.equal(p.filled, 0)
})

test("a player who never appeared renders nothing rather than a zero", () => {
    assert.equal(pickProgress(pick({ live_state: "post", live_value: null })), null)
})

test("an over that has cleared is green, mid-game and settled alike", () => {
    for (const state of ["in", "post"]) {
        const p = pickProgress(pick({ direction: OVER, live_state: state, live_value: 80 }))!
        assert.equal(p.color, colors.success, `over cleared while ${state}`)
    }
})

test("an over short of the line is yellow in play and red once the game ends", () => {
    const live = pickProgress(pick({ direction: OVER, live_state: "in", live_value: 26 }))!
    assert.equal(live.color, colors.warning)

    const done = pickProgress(pick({ direction: OVER, live_state: "post", live_value: 26 }))!
    assert.equal(done.color, colors.danger)
})

test("an over short of the line goes red on a recorded result even mid-game", () => {
    const p = pickProgress(pick({
        direction: OVER, live_state: "in", live_value: 26, result: PickResult.LOSS,
    }))!
    assert.equal(p.color, colors.danger)
})

test("an under still under the line is yellow in play and green once the game ends", () => {
    const live = pickProgress(pick({ direction: UNDER, live_state: "in", live_value: 26 }))!
    assert.equal(live.color, colors.warning)

    const done = pickProgress(pick({ direction: UNDER, live_state: "post", live_value: 26 }))!
    assert.equal(done.color, colors.success)
})

test("an under that has been passed is red immediately and stays red", () => {
    for (const result of [null, PickResult.LOSS, PickResult.WIN]) {
        const p = pickProgress(pick({
            direction: UNDER, live_state: "in", live_value: 80, result,
        }))!
        assert.equal(p.color, colors.danger, `under busted with result ${result}`)
    }
})

test("a push is yellow whatever the numbers say", () => {
    const cleared = pickProgress(pick({
        direction: OVER, live_state: "post", live_value: 80, result: PickResult.PUSH,
    }))!
    assert.equal(cleared.color, colors.warning)

    const short = pickProgress(pick({
        direction: UNDER, live_state: "post", live_value: 80, result: PickResult.PUSH,
    }))!
    assert.equal(short.color, colors.warning)
})

test("an approved veto reads the leg the other way round", () => {
    const base = { line: 49.5, live_state: "post", live_value: 26, direction: OVER }

    const plain = pickProgress(pick(base))!
    assert.equal(plain.color, colors.danger, "26 is short of an over on 49.5")

    const vetoed = pickProgress(pick({
        ...base,
        veto: { approval_status: VetoApprovalStatus.APPROVED } as PickResponseData["veto"],
    }))!
    assert.equal(vetoed.color, colors.success, "the same 26 wins once it reads as an under")
})

test("a veto that is not approved does not flip anything", () => {
    for (const status of [VetoApprovalStatus.PENDING, VetoApprovalStatus.REJECTED]) {
        const p = pickProgress(pick({
            direction: OVER, live_state: "post", live_value: 26,
            veto: { approval_status: status } as PickResponseData["veto"],
        }))!
        assert.equal(p.color, colors.danger, `veto ${status}`)
    }
})

test("a corrected line is the one the leg is judged against", () => {
    const p = pickProgress(pick({
        direction: OVER, line: 49.5, corrected_line: 20.5,
        live_state: "post", live_value: 26,
    }))!
    assert.equal(p.color, colors.success, "26 clears the corrected 20.5, not the original 49.5")
})

test("the bar fills toward the line and stops there", () => {
    const half = pickProgress(pick({ line: 100, live_state: "in", live_value: 50 }))!
    assert.equal(half.filled, 0.5)

    const over = pickProgress(pick({ line: 100, live_state: "in", live_value: 250 }))!
    assert.equal(over.filled, 1, "clamped rather than overflowing the track")

    const negative = pickProgress(pick({ line: 100, live_state: "in", live_value: -5 }))!
    assert.equal(negative.filled, 0)
})

test("a zero line cannot divide the bar by nothing", () => {
    const p = pickProgress(pick({ line: 0, live_state: "post", live_value: 3 }))!
    assert.equal(p.filled, 0)
})
