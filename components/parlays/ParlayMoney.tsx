import React from "react"
import { Text } from "react-native"
import { ParlayResponseData, ParlayResult, ParlayState } from "@/api"
import { money, netPerPerson } from "@/util/payout"
import { colors, typography } from "@/theme/colors"

type Props = {
    parlay: ParlayResponseData
}

/**
 * What a lay is worth, per person.
 *
 * An open lay is a question — five pounds to make a hundred and eighty — so it reads as
 * the journey. A closed one is an answer, so it reads as the single number that landed in
 * or left somebody's pocket. Both are net of the stake: the stored figure has the wager
 * inside it, because that is how a slip prints it, but "made $180" is what anybody means.
 */
export default function ParlayMoney({ parlay }: Props) {
    const net = netPerPerson(parlay)
    const closed = parlay.state === ParlayState.CLOSED

    // A lost lay needs no payout to be reportable — the wager is the whole story. Anything
    // else without one cannot be summarised at all, and saying so is more use than a blank.
    const lost = parlay.result === ParlayResult.LOSS || parlay.result === ParlayResult.BOZO
    if (net === null && !(closed && lost)) {
        return (
            <Text style={{ ...typography.caption, color: colors.textMuted, fontStyle: "italic" }}>
                Missing $ info
            </Text>
        )
    }

    if (closed) {
        if (lost) {
            // The stake, for a bozo as much as a plain loss. What a bozo additionally cost
            // — the return the rest of the lay had earned — rides beside the BOZO tag
            // instead, where it reads as part of the verdict rather than as the damage.
            return (
                <Text style={{ ...typography.caption, color: colors.danger, fontWeight: "700" }}>
                    − {money(parlay.wager_pp)}
                </Text>
            )
        }
        // A push or a void returns the stake and makes nothing, so neither sign is honest.
        if (parlay.result !== ParlayResult.WIN) {
            return (
                <Text style={{ ...typography.caption, color: colors.textSecondary, fontWeight: "600" }}>
                    {money(0)}
                </Text>
            )
        }
        return (
            <Text style={{ ...typography.caption, color: colors.success, fontWeight: "700" }}>
                + {money(net!)}
            </Text>
        )
    }

    return (
        <Text style={{ ...typography.caption, color: colors.textSecondary, fontWeight: "600" }}>
            {money(parlay.wager_pp)}
            <Text style={{ color: colors.textMuted }}> → </Text>
            <Text style={{ color: colors.success }}>{money(net!)}</Text>
        </Text>
    )
}
