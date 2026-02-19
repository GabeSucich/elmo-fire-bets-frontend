import { ParlayResponseData, ParlayState } from "@/api";
import ActionButton from "@/components/reusable/ActionButton";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import React, { useState } from "react";
import { Text, View } from "react-native";
import ReopenParlayModal from "../modals/ReopenParlayModal";

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

    if (isMyOwnedParlay) {
        return (
            <View style={{ alignItems: 'flex-start', marginTop: 8 }}>
                <ActionButton text="Reopen Parlay" onPress={() => setReopenVisible(true)} color="#eab308" />
                <ReopenParlayModal
                    visible={reopenVisible}
                    parlayId={parlay.id}
                    onCancel={() => setReopenVisible(false)}
                />
            </View>
        )
    }

    return (
        <View style={{ alignItems: 'flex-start', marginTop: 8 }}>
            <View style={{ backgroundColor: '#9ca3af', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>Owned by {ownerName}</Text>
            </View>
        </View>
    )
}
