import { ParlayResponseData, ParlayState } from "@/api";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import React, { useState } from "react";
import { View } from "react-native";
import PickCorrectionsModal from "../modals/PickCorrectionsModal";
import ParlayFinalizationModal from "../modals/ParlayFinalizationModal";
import UnlockParlayModal from "../modals/UnlockParlayModal";

import ActionButton from "../../reusable/ActionButton";
import { useParlaysContext } from "@/contexts/parlaysContext";

type Props = {
    parlay: ParlayResponseData
}

export default function OpenParlayFooter({ parlay }: Props) {
    const [pickCorrectionVisible, setPickCorrectionVisible] = useState(false)
    const [finalizationVisible, setFinalizationVisible] = useState(false)
    const [unlockVisible, setUnlockVisible] = useState(false)

    const {
        gamblerId,
        sortedGamblers,
        gamblers,
    } = useGamblingSeasonContext()

    const {
        navToTab,
        setFocusedParlayId,
        unlockParlay: contextUnlockParlay,
        claimParlay,
        refreshParlays
    } = useParlaysContext()

    const isMyOwnedParlay = parlay.owner_id === gamblerId

    const uncorrectedPickCnt = sortedGamblers.length - sortedGamblers.filter(g => {
        return parlay.picks.some(p => p.gambler_id === g.id && !!p.corrected_line)
    }).length

    const picksWithoutResultsCnt = parlay.picks.filter(p => !p.result).length

    const addCorrectionsText = `Add Corrections${uncorrectedPickCnt > 0 ? " (" + uncorrectedPickCnt.toString() + ")" : ''}`

    function unlockParlay() {
        contextUnlockParlay(parlay.id, () => {
            refreshParlays()
            navToTab("Building")
            setFocusedParlayId(parlay.id)
        })
    }

    if (parlay.state !== ParlayState.OPEN) return null

    if (isMyOwnedParlay) {
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <ActionButton text="Unlock" onPress={() => setUnlockVisible(true)} color="#eab308" />

                <View style={{ flexDirection: 'row', gap: 8, marginLeft: 'auto' }}>
                    <ActionButton text={addCorrectionsText} onPress={() => setPickCorrectionVisible(true)} color={uncorrectedPickCnt > 0 ? 'red' : '#3b82f6'} />
                    <ActionButton text="Finalize Result" onPress={() => setFinalizationVisible(true)} disabled={picksWithoutResultsCnt > 0 || uncorrectedPickCnt > 0} />
                </View>

                <PickCorrectionsModal
                    visible={pickCorrectionVisible}
                    parlay={parlay}
                    dismissModal={() => {
                        setPickCorrectionVisible(false)
                    }}
                />
                <ParlayFinalizationModal
                    visible={finalizationVisible}
                    dismissModal={() => {
                        setFinalizationVisible(false)
                    }}
                    parlay={parlay}
                />
                <UnlockParlayModal
                    visible={unlockVisible}
                    onCancel={() => setUnlockVisible(false)}
                    onSubmit={() => {
                        setUnlockVisible(false)
                        unlockParlay()
                    }}
                />

            </View>
        )
    }

    const ownerName = gamblers[parlay.owner_id].firstName
    return (
        <View style={{ alignItems: 'flex-start', marginTop: 8 }}>
            <ActionButton text={`Claim from ${ownerName}`} onPress={() => claimParlay(parlay.id, gamblerId)} />
        </View>
    )
}
