import assert from "node:assert/strict"
import test from "node:test"

import { GamblerPerformance, SetMetrics } from "@/api"
import { buildIceCold, buildOlTrusties } from "@/util/trends"

/** A target's record, as the metrics endpoint reports it. */
function metrics(wins: number, losses: number, extra: Partial<SetMetrics> = {}): SetMetrics {
    const pushes = extra.pushes ?? 0
    const voids = extra.voids ?? 0
    const decided = wins + losses
    return {
        total: decided + pushes + voids,
        wins,
        losses,
        pushes,
        voids,
        win_rate: decided === 0 ? null : (wins / decided) * 100,
        ...extra,
    } as SetMetrics
}

/** A performance carrying only the non-TD player records a trend list reads. */
function performance(targets: Record<string, SetMetrics>): GamblerPerformance {
    const names = Object.fromEntries(Object.keys(targets).map(id => [id, `Player ${id}`]))
    return {
        metrics: {
            non_TD_slate: { prop_targets: targets, target_names: names, bet_types: {} },
            TD_slate: { prop_targets: {}, target_names: {}, bet_types: {} },
        },
    } as unknown as GamblerPerformance
}

const names = (summaries: { name: string }[]) => summaries.map(s => s.name)

test("a perfect record fills a list that would otherwise be empty", () => {
    const perf = performance({ "1": metrics(2, 0), "2": metrics(0, 2) })

    assert.deepEqual(names(buildOlTrusties(perf)), ["Player 1"])
    assert.deepEqual(names(buildIceCold(perf)), ["Player 2"])
})

test("a perfect short record never displaces a full-sample one", () => {
    const perf = performance({ "1": metrics(2, 0), "2": metrics(3, 1) })

    assert.deepEqual(names(buildOlTrusties(perf)), ["Player 2", "Player 1"])
})

test("a full list takes no backfill at all", () => {
    const perf = performance({
        "1": metrics(3, 1), "2": metrics(4, 1), "3": metrics(5, 2), "4": metrics(2, 0),
    })

    assert.deepEqual(names(buildOlTrusties(perf)), ["Player 2", "Player 1", "Player 3"])
})

test("backfill stops at the slots left over", () => {
    const perf = performance({
        "1": metrics(3, 1), "2": metrics(2, 0), "3": metrics(2, 0), "4": metrics(2, 0),
    })

    const trusties = buildOlTrusties(perf)
    assert.equal(trusties.length, 3)
    assert.deepEqual(names(trusties).slice(0, 1), ["Player 1"])
})

test("a losing short record cannot backfill the winning list", () => {
    const perf = performance({ "1": metrics(0, 2), "2": metrics(3, 1) })

    assert.deepEqual(names(buildOlTrusties(perf)), ["Player 2"])
    assert.deepEqual(names(buildIceCold(perf)), ["Player 1"])
})

test("a mixed record still needs three decided picks", () => {
    const perf = performance({ "1": metrics(1, 1), "2": metrics(2, 1), "3": metrics(1, 2) })

    assert.deepEqual(names(buildOlTrusties(perf)), ["Player 2"])
    assert.deepEqual(names(buildIceCold(perf)), ["Player 3"])
})

test("a single decided pick never qualifies, perfect or not", () => {
    const perf = performance({ "1": metrics(1, 0), "2": metrics(0, 1) })

    assert.deepEqual(buildOlTrusties(perf), [])
    assert.deepEqual(buildIceCold(perf), [])
})

test("pushes and voids do not fill out the perfect-record sample", () => {
    const perf = performance({ "1": metrics(1, 0, { pushes: 1, voids: 1 }) })

    assert.deepEqual(buildOlTrusties(perf), [])
})

test("full-sample perfect runs rank among themselves before any backfill", () => {
    const perf = performance({ "1": metrics(2, 0), "2": metrics(4, 0), "3": metrics(3, 0) })

    assert.deepEqual(names(buildOlTrusties(perf)), ["Player 2", "Player 3", "Player 1"])
})
