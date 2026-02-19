import { PickResponseData, PropBetDirection, SauceFactor, VetoApprovalStatus } from "@/api"

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
            sauceSuffix = ' 🔥'
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