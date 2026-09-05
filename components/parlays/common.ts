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
