import { ParlayResponseData, ParlaysService, ParlayState } from "@/api";
import ActionButton from "@/components/reusable/ActionButton";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import { useParlaysContext } from "@/contexts/parlaysContext";
import { setApiErrorMsg } from "@/util/error";
import React, { useState } from "react";
import { Text, View } from "react-native";
import ReopenParlayModal from "../modals/ReopenParlayModal";

type Props = {
    parlay: ParlayResponseData
}

export default function ClosedParlayFooter({parlay}: Props) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reopenVisible, setReopenVisible] = useState(false)
    const {
        gamblerId,
        gamblers
    } = useGamblingSeasonContext()

    const isMyOwnedParlay = parlay.owner_id === gamblerId
    const ownerName = gamblers[parlay.owner_id].firstName

    const {
        navToTab,
        setFocusedParlayId,
        focusedParlayId,
        refreshParlays,
        refreshParlay
    } = useParlaysContext()

    function reopenParlay() {
        setLoading(true)
        setError(null)
        ParlaysService.reopenParlay(parlay.id, {})
        .then(res => {
            refreshParlays()
            navToTab("Open")
            setFocusedParlayId(parlay.id)
        })
    }

    function claimParlay() {
        setLoading(true)
        setError(null)
        ParlaysService.claimParlay(parlay.id, { gambler_id: gamblerId })
            .then(res => {
                refreshParlay(parlay.id)
            })
            .catch(err => setApiErrorMsg(err, setError, "There was an error claiming the lay"))
            .finally(() => setLoading(false))
    }

    if (parlay.state !== ParlayState.CLOSED) return null

    if (isMyOwnedParlay) {
        return (
            <View style={{ alignItems: 'flex-start', marginTop: 8 }}>
                <ActionButton text="Reopen Parlay" onPress={() => setReopenVisible(true)} color="#eab308" />
                <ReopenParlayModal
                    visible={reopenVisible}
                    onCancel={() => setReopenVisible(false)}
                    onSubmit={() => {
                        setReopenVisible(false)
                        reopenParlay()
                    }}
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