import { PickListItemResponseData, PickListPlacementEntryResponseData, PickListType, PropBetDirection, PropBetType } from "@/api"
import { colors } from "@/theme/colors"

/**
 * How each kind of list draws.
 *
 * Kept on the client rather than stored per list, because a new list type is a new enum
 * member either way — the server cannot ship one without a client that knows the name, so
 * it may as well pick the mark here where the icon set actually lives.
 */
export const PICK_LIST_DISPLAY: Record<PickListType, { icon: string, color: string }> = {
    [PickListType.BAN]: { icon: "alert", color: colors.danger },
}

/** What an unset narrowing means, said out loud. */
export const ANY_PROP_LABEL = "Any prop"
export const ANY_DIRECTION_LABEL = "Either way"

type Narrowing = {
    prop_type: PropBetType | null
    direction: PropBetDirection | null
}

/**
 * An entry as a single line: what is banned, and on which side.
 *
 * Reads the same in the list itself and in the drawer over a parlay pick, so somebody who
 * recognises "Rec Yards · Over" on one screen is not decoding a different phrasing on the
 * other.
 */
export function describeNarrowing(entry: Narrowing): string {
    const market = entry.prop_type ?? ANY_PROP_LABEL
    return entry.direction ? `${market} · ${entry.direction}` : market
}

/** The player or team an entry is about. */
export function entryTargetName(item: PickListItemResponseData): string {
    return item.prop_bet_target.player_name ?? item.prop_bet_target.team_name
}

/** Sorted the way the list reads: by player, then narrowest last. */
export function sortItems(items: PickListItemResponseData[]): PickListItemResponseData[] {
    return [...items].sort((a, b) =>
        entryTargetName(a).localeCompare(entryTargetName(b))
        || (a.prop_type ?? "").localeCompare(b.prop_type ?? "")
        || (a.direction ?? "").localeCompare(b.direction ?? "")
    )
}

export type PlacementEntry = PickListPlacementEntryResponseData
