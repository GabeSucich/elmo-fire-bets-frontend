import { ParlayResponseData, ParlayState } from "@/api";
import ActionButton, { buttonBoxStyle, buttonContentStyle, buttonLabelStyle } from "@/components/reusable/ActionButton";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import React, { useState } from "react";
import { Text, View } from "react-native";
import ReopenParlayModal from "../modals/ReopenParlayModal";
import PayoutButton from "../PayoutButton";
import { colors, spacing } from "@/theme/colors";

type Props = {
    parlay: ParlayResponseData
}

export default function ClosedParlayFooter({parlay}: Props) {
    const [reopenVisible, setReopenVisible] = useState(false)

    const {
        gamblerId,
        gamblers
    } = useGamblingSeasonContext()

    const isMyOwnedParlay = parlay.owner_id === gamblerId
    const ownerName = gamblers[parlay.owner_id].firstName

    if (parlay.state !== ParlayState.CLOSED) return null

    // Collapsing lives on the card header's date caret now, for every parlay state.

    if (isMyOwnedParlay) {
        return (
            <View style={{
                flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
                gap: spacing.sm, marginTop: spacing.md,
            }}>
                <ActionButton text="Reopen Parlay" onPress={() => setReopenVisible(true)} color={colors.warning} />
                <PayoutButton parlay={parlay} />
                <ReopenParlayModal
                    visible={reopenVisible}
                    parlayId={parlay.id}
                    onCancel={() => setReopenVisible(false)}
                />
            </View>
        )
    }

    // Recording what a lay paid is not the owner's job alone: everybody on it has the same
    // money riding, and whoever has the slip in front of them should be able to enter it
    // rather than waiting on one person to get round to it.
    return (
        <View style={{
            flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
            gap: spacing.sm, marginTop: spacing.md,
        }}>
            {/* Not a button, but it stands in a row of them — so it borrows their box
                rather than guessing at it and sitting a few pixels short. */}
            <View style={{ backgroundColor: colors.buttonSecondary, ...buttonBoxStyle }}>
                <View style={buttonContentStyle}>
                    <Text style={{ ...buttonLabelStyle, color: colors.textPrimary, fontWeight: '500' }}>
                        Owned by {ownerName}
                    </Text>
                </View>
            </View>
            <PayoutButton parlay={parlay} />
        </View>
    )
}
