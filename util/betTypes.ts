import { PropBetType } from "@/api";

const BET_TYPE_SORT_MAP: Record<PropBetType, number> = {
    [PropBetType.REC_YARDS]: 0,
    [PropBetType.RUSH_YARDS]: 1,
    [PropBetType.RUSH_REC_YDS]: 2,
    [PropBetType.PASSING_YDS]: 3,
    [PropBetType.RECEPTIONS]: 4,
    [PropBetType.RUSH_ATTEMPTS]: 5,
    [PropBetType.TDS]: 6,
    [PropBetType.FGS]: 7,
    [PropBetType.PASSING_INTS]: 8,
    [PropBetType.PASSING_TDS]: 9,
    [PropBetType.PASS_COMPLETIONS]: 10,
    [PropBetType.PASS_ATTEMPTS]: 11,
    [PropBetType.SACKS]: 12,
    [PropBetType.TACKLES_ASSISTS]: 13,
    [PropBetType.TARGETS]: 14,
    [PropBetType.LONGEST_RUSH]: 15,
    [PropBetType.LONGEST_RECEPTION]: 16,
    [PropBetType.LONGEST_COMPLETION]: 17,
    [PropBetType.LONGEST_TD]: 18
}

export function makeSortedBetTypes(): PropBetType[] {
    return Object.values(PropBetType).sort((a, b) => {
        return BET_TYPE_SORT_MAP[a] - BET_TYPE_SORT_MAP[b]
    })
}

export function betTypeToColor(betType: PropBetType): string {
    return "blue"
}