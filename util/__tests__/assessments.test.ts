import assert from "node:assert/strict"
import test from "node:test"

import {
    AssessmentSlotData,
    ParlayAssessmentResponseData,
    PickResponseData,
    PropBetDirection,
    PropBetType,
    SlotStatus,
    VetoApprovalStatus,
} from "@/api"
import { canReanalyze, changesSince, describeAssessedPick, shouldAnalyzeAutomatically, shouldShowSlot, slotNotice } from "@/util/assessments"

const assessed = {
    pick_id: 1,
    player: "Ja'Marr Chase",
    prop_type: PropBetType.REC_YARDS,
    line: 54.5,
    direction: PropBetDirection.OVER,
    sauce_factor: null,
    vetoed: false,
}

function pick(overrides: Partial<PickResponseData> = {}): PickResponseData {
    return {
        id: 1,
        line: 54.5,
        corrected_line: null,
        direction: PropBetDirection.OVER,
        sauce_factor: null,
        veto: null,
        prop_type: PropBetType.REC_YARDS,
        prop_bet_target: { player_name: "Ja'Marr Chase", team_name: "CIN" },
        ...overrides,
    } as PickResponseData
}

function slot(status: SlotStatus, pickId: number | null = 1): AssessmentSlotData {
    return {
        pick_id: pickId,
        status,
        suggestions: [],
        assessed_at: status === SlotStatus.MISSING ? null : "2026-10-04T12:00:00",
        assessed_against: status === SlotStatus.MISSING ? [] : [assessed],
    }
}

function response(...statuses: SlotStatus[]): ParlayAssessmentResponseData {
    const [parlay, ...picks] = statuses
    return {
        can_request: true,
        request_blocked_reason: null,
        picks: picks.map((s, i) => slot(s, i + 1)),
        parlay: slot(parlay, null),
    }
}

test("an assessed pick reads the way the pick card does", () => {
    assert.equal(describeAssessedPick(assessed), "Over 54.5 Rec Yards")
    assert.equal(describeAssessedPick({ ...assessed, vetoed: true }), "Over 54.5 Rec Yards (Veto)")
})

test("a moved line is named with both numbers", () => {
    assert.deepEqual(changesSince(assessed, pick({ line: 49.5 })), ["line 54.5 → 49.5"])
})

test("a correction counts as the line, since that is what was bet", () => {
    assert.deepEqual(changesSince(assessed, pick({ corrected_line: 54.5, line: 60.5 })), [])
})

test("a veto approved since is called out", () => {
    const vetoed = pick({ veto: { approval_status: VetoApprovalStatus.APPROVED } as PickResponseData["veto"] })
    assert.deepEqual(changesSince(assessed, vetoed), ["vetoed since"])
})

test("a stale pick says what it was assessed as and what changed", () => {
    assert.equal(
        slotNotice(slot(SlotStatus.STALE), pick({ direction: PropBetDirection.UNDER })),
        "Analyzed as Over 54.5 Rec Yards. The pick has changed since (was the over).",
    )
})

test("only a stale slot needs an explanation", () => {
    assert.equal(slotNotice(slot(SlotStatus.FRESH), pick()), null)
    assert.equal(slotNotice(slot(SlotStatus.OUTDATED), pick()), null)
    assert.equal(slotNotice(slot(SlotStatus.MISSING), pick()), null)
})

test("nothing analyzed yet starts an analysis on its own", () => {
    assert.equal(shouldAnalyzeAutomatically(response(SlotStatus.MISSING, SlotStatus.MISSING)), true)
    assert.equal(shouldAnalyzeAutomatically(response(SlotStatus.MISSING, SlotStatus.FRESH)), false)
    assert.equal(
        shouldAnalyzeAutomatically({ ...response(SlotStatus.MISSING, SlotStatus.MISSING), can_request: false }),
        false,
    )
})

test("re-analysis is offered only when something differs", () => {
    assert.equal(canReanalyze(response(SlotStatus.FRESH, SlotStatus.FRESH)), false)
    assert.equal(canReanalyze(response(SlotStatus.STALE, SlotStatus.FRESH)), true)
    assert.equal(canReanalyze(response(SlotStatus.FRESH, SlotStatus.OUTDATED)), true)
    // A pick added since the last analysis has no slot of its own yet.
    assert.equal(canReanalyze(response(SlotStatus.FRESH, SlotStatus.FRESH, SlotStatus.MISSING)), true)
    assert.equal(canReanalyze(response(SlotStatus.MISSING, SlotStatus.MISSING)), false)
})

test("only slots with something to say get a card", () => {
    const concern = { title: "Cold", description: "1 of 5." }
    assert.equal(shouldShowSlot(slot(SlotStatus.FRESH)), false)
    assert.equal(shouldShowSlot({ ...slot(SlotStatus.FRESH), suggestions: [concern] }), true)
    assert.equal(shouldShowSlot({ ...slot(SlotStatus.OUTDATED), suggestions: [concern] }), true)
    assert.equal(shouldShowSlot(slot(SlotStatus.MISSING)), false)
    // No suggestions come back for a stale slot, but what changed is still worth saying.
    assert.equal(shouldShowSlot(slot(SlotStatus.STALE)), true)
})
