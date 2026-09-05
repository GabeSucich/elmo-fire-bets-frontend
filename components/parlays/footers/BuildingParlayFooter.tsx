import { ParlayResponseData, ParlayState, VetoApprovalStatus } from "@/api";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import React, { useState } from "react";
import { View } from "react-native";
import LockConfirmModal from "../modals/LockConfirmModal";
import ClaimConfirmModal from "../modals/ClaimConfirmModal";
import PendingVetoConfirmModal from "../modals/PendingVetoConfirmModal";
import ActionButton from "../../reusable/ActionButton";
import { useParlaysContext } from "@/contexts/parlaysContext";
import { spacing } from "@/theme/colors";

type Props = {
    parlay: ParlayResponseData
}

export default function BuildingParlayFooter({ parlay }: Props) {
    const [lockConfirmVisible, setLockConfirmVisible] = useState(false)
    const [vetoConfirmVisible, setVetoConfirmVisible] = useState(false)
    const [claimConfirmVisible, setClaimConfirmVisible] = useState(false)

    const { gamblerId, gamblers } = useGamblingSeasonContext()
    const {
        navToTab,
        setFocusedParlayId,
        lockParlay: contextLockParlay,
        claimParlay,
        refreshParlays
    } = useParlaysContext()

    const isMyOwnedParlay = parlay.owner_id === gamblerId
    const hasPendingVeto = () => parlay.picks.some(p => p.veto?.approval_status === VetoApprovalStatus.PENDING)
    const pendingVeto = () => parlay.picks.find(p => p.veto?.approval_status === VetoApprovalStatus.PENDING)?.veto ?? null

    function lockParlay() {
        contextLockParlay(parlay.id, () => {
            refreshParlays()
            navToTab("Open")
            setFocusedParlayId(parlay.id)
        })
    }

    function handleLockConfirm() {
        setLockConfirmVisible(false)
        if (hasPendingVeto()) {
            setVetoConfirmVisible(true)
        } else {
            lockParlay()
        }
    }

    if (parlay.state !== ParlayState.BUILDING) return null

    if (isMyOwnedParlay) {
        return (
            <View style={{ alignItems: 'flex-end', marginTop: spacing.md }}>
                <ActionButton text="Lock Lay" onPress={() => setLockConfirmVisible(true)} />

                <LockConfirmModal
                    visible={lockConfirmVisible}
                    onCancel={() => setLockConfirmVisible(false)}
                    onConfirm={handleLockConfirm}
                />

                {pendingVeto() && (
                    <PendingVetoConfirmModal
                        visible={vetoConfirmVisible}
                        veto={pendingVeto()!}
                        onCancel={() => setVetoConfirmVisible(false)}
                        onProceed={() => {
                            setVetoConfirmVisible(false)
                            lockParlay()
                        }}
                    />
                )}
            </View>
        )
    }

    const ownerName = gamblers[parlay.owner_id]?.firstName

    return (
        <View style={{ alignItems: 'flex-end', marginTop: spacing.md }}>
            <ActionButton text={`Claim from ${ownerName}`} onPress={() => setClaimConfirmVisible(true)} />

            <ClaimConfirmModal
                visible={claimConfirmVisible}
                onCancel={() => setClaimConfirmVisible(false)}
                onConfirm={() => {
                    setClaimConfirmVisible(false)
                    claimParlay(parlay.id, gamblerId)
                }}
            />
        </View>
    )
}
