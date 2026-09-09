import { PickResponseData, PropBetDirection, SauceFactor, VetoApprovalStatus } from "@/api"


/**
 * Where a price stops being ordinary.
 *
 * American odds never land between -100 and +100, so the two numbers order cleanly and a
 * single comparison decides each side: a longer shot pays more (+105, +140, +300 all sit
 * above the line) and a heavier favourite pays less (-130, -180, -250 all sit below it).
 */
const SPICY_ODDS_AT_LEAST = 105
const BITCH_ODDS_AT_MOST = -130

/**
 * "+105" as 105, "-130" as -130; null for anything unparseable.
 *
 * The book sends these as signed strings and occasionally sends nothing at all — an
 * unpriced side is a real state, not an error, so it simply yields no opinion.
 */
export function parseAmericanOdds(value: string | null | undefined): number | null {
    if (!value) return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
}

/**
 * The sauce a price implies, or null when it implies nothing.
 *
 * A suggestion rather than a verdict: whoever is making the bet can still say it is spicy
 * at -140 because of what they know about the matchup, and the editor lets them.
 */
export function sauceFactorForOdds(value: string | null | undefined): SauceFactor | null {
    const odds = parseAmericanOdds(value)
    if (odds === null) return null
    if (odds >= SPICY_ODDS_AT_LEAST) return SauceFactor.SPICY
    if (odds <= BITCH_ODDS_AT_MOST) return SauceFactor.BITCH
    return null
}

export const PickDisplayUtil = {
    playerTeamDisplay: (pick: PickResponseData) => {
        const {
            player_name,
            team_name
        } = pick.prop_bet_target
        return player_name ? `${player_name} (${team_name})` : team_name
    },

    lineAndDirectionDisplay: (pick: PickResponseData, showVeto?: boolean, sauceFactor?: SauceFactor) => {
        const {
            line,
            corrected_line,
            direction,
            prop_type,
            veto
        } = pick

        const showVetoIfAvailable = showVeto ?? false
        const approvedVeto = veto?.approval_status === VetoApprovalStatus.APPROVED
        showVeto = (showVetoIfAvailable && approvedVeto)

        const correctedDirection = showVeto ? (
            direction === PropBetDirection.OVER ? PropBetDirection.UNDER : PropBetDirection.OVER
        ) : direction

        const vetoedSuffix = showVeto ? ` (Veto)` : ''
        let sauceSuffix = ''
        if (sauceFactor === SauceFactor.BITCH) {
            sauceSuffix = ' 💩'
        } else if (sauceFactor === SauceFactor.SPICY) {
            sauceSuffix = ' 🌶️'
        }

        const lineToUse = (corrected_line ?? line).toFixed(1)
        return {
            lineDisplay: `${correctedDirection} ${lineToUse}${sauceSuffix}${vetoedSuffix}`,
            directionDisplay: correctedDirection
        }
    }
}

export function getPickLine(pick: PickResponseData) {
    return pick.corrected_line ?? pick.line
}

/** The emoji that stands for each designation, used wherever one is shown or chosen. */
export const SAUCE_EMOJI: Record<SauceFactor, string> = {
    [SauceFactor.SPICY]: "🌶️",
    [SauceFactor.BITCH]: "💩",
}

export function sauceFactorDisplay(sauceFactor: SauceFactor): string {
    return `${SAUCE_EMOJI[sauceFactor]} ${sauceFactor}`
}
