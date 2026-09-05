import { ParlayResponseData, ParlayState } from "@/api";
import ActionButton from "@/components/reusable/ActionButton";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import React, { useState } from "react";
import { Text, View } from "react-native";
import ReopenParlayModal from "../modals/ReopenParlayModal";
import { colors, typography, spacing } from "@/theme/colors";

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
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md }}>
                <ActionButton text="Reopen Parlay" onPress={() => setReopenVisible(true)} color={colors.warning} />
                <ReopenParlayModal
                    visible={reopenVisible}
                    parlayId={parlay.id}
                    onCancel={() => setReopenVisible(false)}
                />
            </View>
        )
    }

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md }}>
            <View style={{
                backgroundColor: colors.buttonSecondary,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.md,
                borderRadius: 8,
            }}>
                <Text style={{ color: colors.textPrimary, ...typography.caption, fontWeight: '500' }}>Owned by {ownerName}</Text>
            </View>
        </View>
    )
}
