import assert from "node:assert/strict"
import test from "node:test"

import { PickListItemResponseData, PropBetDirection, PropBetType } from "@/api"
import { describeNarrowing, entryTargetName, sortItems } from "@/util/pickLists"

function item(fields: Partial<PickListItemResponseData>): PickListItemResponseData {
    return {
        id: 1,
        pick_list_id: 1,
        gambler_id: 1,
        prop_bet_target_id: 1,
        prop_bet_target: { id: 1, identifier: "x", player_name: "Ja'Marr Chase", team_name: "cin" },
        prop_type: null,
        direction: null,
        ...fields,
    }
}

test("an entry with neither narrowing reads as the whole player", () => {
    assert.equal(describeNarrowing({ prop_type: null, direction: null }), "Any prop")
})

test("a market on its own names the market and no side", () => {
    assert.equal(
        describeNarrowing({ prop_type: PropBetType.REC_YARDS, direction: null }),
        "Rec Yards"
    )
})

test("a side on its own still says which markets it covers", () => {
    assert.equal(
        describeNarrowing({ prop_type: null, direction: PropBetDirection.OVER }),
        "Any prop · Over"
    )
})

test("both narrowings read as the bet itself", () => {
    assert.equal(
        describeNarrowing({ prop_type: PropBetType.REC_YARDS, direction: PropBetDirection.UNDER }),
        "Rec Yards · Under"
    )
})

test("a team target falls back to its abbreviation", () => {
    assert.equal(
        entryTargetName(item({ prop_bet_target: { id: 2, identifier: "y", player_name: null, team_name: "buf" } })),
        "buf"
    )
})

test("entries group by player, then by market, with the broader one first", () => {
    const rows = sortItems([
        item({ id: 3, prop_type: PropBetType.REC_YARDS, direction: PropBetDirection.OVER }),
        item({ id: 1, prop_bet_target: { id: 2, identifier: "y", player_name: "Bijan Robinson", team_name: "atl" } }),
        item({ id: 2, prop_type: PropBetType.REC_YARDS, direction: null }),
    ])
    assert.deepEqual(rows.map(r => r.id), [1, 2, 3])
})
