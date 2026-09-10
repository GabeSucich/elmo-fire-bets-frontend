import { PropBetType } from "@/api";

type TargetPosType = "Offense" | "Defense" | "Team"

const BET_TYPE_SORT_MAP: Record<PropBetType, {
    order: number,
    posType: TargetPosType
}> = {
    [PropBetType.REC_YARDS]: { order: 0, posType: "Offense" },
    [PropBetType.RUSH_YARDS]: { order: 1, posType: "Offense" },
    [PropBetType.RUSH_REC_YDS]: { order: 2, posType: "Offense" },
    [PropBetType.PASSING_YDS]: { order: 3, posType: "Offense" },
    [PropBetType.RECEPTIONS]: { order: 4, posType: "Offense" },
    [PropBetType.RUSH_ATTEMPTS]: { order: 5, posType: "Offense" },
    [PropBetType.TDS]: { order: 6, posType: "Offense" },
    // The specific touchdown markets sit next to the general one they narrow.
    [PropBetType.RUSH_TDS]: { order: 7, posType: "Offense" },
    [PropBetType.REC_TDS]: { order: 8, posType: "Offense" },
    [PropBetType.FGS]: { order: 9, posType: "Team" },
    [PropBetType.PASSING_INTS]: { order: 10, posType: "Offense" },
    [PropBetType.PASSING_TDS]: { order: 11, posType: "Offense" },
    [PropBetType.PASS_COMPLETIONS]: { order: 12, posType: "Offense" },
    [PropBetType.PASS_ATTEMPTS]: { order: 13, posType: "Offense" },
    [PropBetType.SACKS]: { order: 14, posType: "Defense" },
    [PropBetType.TACKLES_ASSISTS]: { order: 15, posType: "Defense" },
    [PropBetType.TARGETS]: { order: 16, posType: "Offense" },
    [PropBetType.LONGEST_RUSH]: { order: 17, posType: "Offense" },
    [PropBetType.LONGEST_RECEPTION]: { order: 18, posType: "Offense" },
    [PropBetType.LONGEST_COMPLETION]: { order: 19, posType: "Offense" },
    [PropBetType.LONGEST_TD]: { order: 20, posType: "Offense" },
}


const TEAM_ONLY_BET_TYPES = [PropBetType.FGS]

/**
 * Markets a season-long pick cannot settle, because their season figure is the best
 * single game rather than the sum of every game.
 *
 * Season progress adds each week's value up, which is right for a stat you accumulate
 * and nonsense for one you only ever set a new best in — fifteen weeks of a longest
 * reception sum to 329 yards for a player whose longest all year was 45. Rather than
 * teach progress a second kind of arithmetic for four markets nobody has picked, they
 * are simply not offered.
 */
const SEASON_UNSUPPORTED_BET_TYPES = [
    PropBetType.LONGEST_RUSH,
    PropBetType.LONGEST_RECEPTION,
    PropBetType.LONGEST_TD,
    PropBetType.LONGEST_COMPLETION,
]

export function makeSortedBetTypes(): PropBetType[] {
    return Object.values(PropBetType).sort((a, b) => {
        return BET_TYPE_SORT_MAP[a].order - BET_TYPE_SORT_MAP[b].order
    })
}

export function betTypeToColor(betType: PropBetType): string {
    return "blue"
}

export function makeSortedPlayerBetTypes(): PropBetType[] {
    return makeSortedBetTypes().filter(bt => !TEAM_ONLY_BET_TYPES.includes(bt))
}

export function makeSortedTeamBetTypes(): PropBetType[] {
    return makeSortedBetTypes().filter(bt => TEAM_ONLY_BET_TYPES.includes(bt))
}

export function makeSortedSeasonBetTypes(): PropBetType[] {
    return makeSortedBetTypes().filter(bt => !SEASON_UNSUPPORTED_BET_TYPES.includes(bt))
}
