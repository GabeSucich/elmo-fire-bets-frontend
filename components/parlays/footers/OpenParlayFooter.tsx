import { ParlayResponseData, ParlayState } from "@/api";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import React, { useState } from "react";
import { View } from "react-native";
import PickCorrectionsModal from "../modals/PickCorrectionsModal";
import ParlayFinalizationModal from "../modals/ParlayFinalizationModal";
import UnlockParlayModal from "../modals/UnlockParlayModal";

import ActionButton from "../../reusable/ActionButton";
import { useParlaysContext } from "@/contexts/parlaysContext";
import { colors, spacing } from "@/theme/colors";

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
        refreshParlays,
        syncProgress,
        syncingParlayId
    } = useParlaysContext()

    const isMyOwnedParlay = parlay.owner_id === gamblerId

    const uncorrectedPickCnt = sortedGamblers.length - sortedGamblers.filter(g => {
        return parlay.picks.some(p => p.gambler_id === g.id && !!p.corrected_line)
    }).length

    const picksWithoutResultsCnt = parlay.picks.filter(p => !p.result).length

    // The button says whether there is anything left to enter; a count of how many said
    // the same thing twice, and the tabs below already flag who is outstanding.
    const slipOutstanding = uncorrectedPickCnt > 0
    const slipText = slipOutstanding ? "Add Slip" : "Update Slip"

    // A leg whose game is under way or already over. Merely having been synced is not
    // enough: a lay checked the morning of a slate is every bit as unlockable as one
    // nobody has touched.
    const anyLineLive = parlay.picks.some(
        p => p.live_state === "in" || p.live_state === "post"
    )

    // Unlocking drops the lay back to Building, which undoes every correction and deletes
    // every result. That is a reasonable thing to do to a lay nobody has acted on yet, and
    // an alarming one to offer once the games have started or the slip is in — by then the
    // bet is real and the button is a way to lose work rather than a way to fix a mistake.
    const canUnlock = !anyLineLive && slipOutstanding

    const syncButton = (
        <ActionButton
            icon="sync"
            accessibilityLabel="Sync live progress"
            onPress={() => syncProgress(parlay.id)}
            loading={syncingParlayId === parlay.id}
            color={colors.accent}
        />
    )

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
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, flexWrap: 'wrap', gap: spacing.sm }}>
                {/* An icon rather than a label, but still a filled button. The confirmation
                    names the action and spells out what it undoes. */}
                {canUnlock && (
                    <ActionButton
                        icon="lock-open-variant-outline"
                        accessibilityLabel="Unlock lay"
                        onPress={() => setUnlockVisible(true)}
                        color={colors.warning}
                    />
                )}
                {syncButton}

                <View style={{ flexDirection: 'row', gap: spacing.sm, marginLeft: 'auto' }}>
                    <ActionButton
                        text={slipText}
                        onPress={() => setPickCorrectionVisible(true)}
                        color={slipOutstanding ? colors.accent : colors.buttonSecondary}
                    />
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

    // Syncing is not an owner's privilege: it reads a public feed and writes only what
    // ESPN says, and the people watching a lay they do not own are exactly the ones who
    // want to see how it is going.
    const ownerName = gamblers[parlay.owner_id].firstName
    return (
        <View style={{
            flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
            gap: spacing.sm, marginTop: spacing.md,
        }}>
            {syncButton}
            <ActionButton text={`Claim from ${ownerName}`} onPress={() => claimParlay(parlay.id, gamblerId)} />
        </View>
    )
}
