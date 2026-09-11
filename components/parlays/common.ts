import { spacing } from "@/theme/colors"
import { SlateType } from "@/api"

export type ParlayEditArgs = {
    competitionDate: string
    ownerId: number
    slateType: SlateType
    wagerPp: number
}
/** Full names for the slate abbreviations shown on a parlay card. */
const SLATE_TYPE_NAMES: Record<SlateType, string> = {
    [SlateType.TNF]: "Thursday Night Football",
    [SlateType.FNF]: "Friday Night Football",
    [SlateType.WNF]: "Wednesday Night Football",
    [SlateType.SATURDAY]: "Saturday",
    [SlateType.MORNING_SLATE]: "Sunday Morning Slate",
    [SlateType.AFTERNOON_SLATE]: "Sunday Afternoon Slate",
    [SlateType.SNF]: "Sunday Night Football",
    [SlateType.MNF]: "Monday Night Football",
    [SlateType.TD]: "Touchdown",
    [SlateType.XMAS]: "Christmas",
    [SlateType.INTERNATIONAL_GAME]: "International Game",
    [SlateType.WILDCARD]: "Wildcard",
    [SlateType.DIVISIONAL]: "Divisional",
    [SlateType.CONFERENCE]: "Conference",
}

export function slateTypeDisplay(slateType: SlateType): string {
    return SLATE_TYPE_NAMES[slateType] ?? slateType
}

/**
 * The floating "add parlay" button, and the room a list needs to clear it.
 *
 * Shared because the two live in different files and only agree by arithmetic: the list
 * has no idea a button is hovering over it, and the button has no idea what it is covering.
 * With the numbers apart, the last card in a list sits under the button and nothing can be
 * scrolled far enough to read it.
 */
export const FAB_SIZE = 56
export const FAB_BOTTOM = spacing.xl

/** Past the button rather than up to it, so the last row clears it with room to spare. */
export const LIST_BOTTOM_CLEARANCE = FAB_BOTTOM + FAB_SIZE + spacing.xl
