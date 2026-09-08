import { ParlayResponseData, ParlayState, VetoApprovalStatus } from "@/api";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import React, { useState } from "react";
import { View } from "react-native";
import LockConfirmModal from "../modals/LockConfirmModal";
import PickCorrectionsModal from "../modals/PickCorrectionsModal";
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
    const [slipVisible, setSlipVisible] = useState(false)
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

    /**
     * Locking runs the same way whether the slip was added first or deferred; a pending
     * veto still has to be settled before either can proceed.
     */
    function proceedToLock() {
        if (hasPendingVeto()) {
            setVetoConfirmVisible(true)
        } else {
            lockParlay()
        }
    }

    function handleAddSlip() {
        setLockConfirmVisible(false)
        setSlipVisible(true)
    }

    function handleLockWithoutSlip() {
        setLockConfirmVisible(false)
        proceedToLock()
    }

    /**
     * The slip flow was entered to lock, so submitting it does what the lock button would
     * have: the adjustments are already saved, and the lay moves on to Open.
     *
     * Only submission locks. Backing out with the X leaves the lay in Building, because
     * closing a dialog should not commit the thing it was asking about.
     */
    function handleSlipSubmitted() {
        setSlipVisible(false)
        proceedToLock()
    }

    if (parlay.state !== ParlayState.BUILDING) return null

    if (isMyOwnedParlay) {
        return (
            <View style={{ alignItems: 'flex-end', marginTop: spacing.md }}>
                {/* An icon rather than a label, but still a filled button: it is the primary
                    action on a building lay, and the confirmation names it. */}
                <ActionButton
                    icon="lock-outline"
                    accessibilityLabel="Lock lay"
                    onPress={() => setLockConfirmVisible(true)}
                />

                <LockConfirmModal
                    visible={lockConfirmVisible}
                    onCancel={() => setLockConfirmVisible(false)}
                    onAddSlip={handleAddSlip}
                    onLockWithoutSlip={handleLockWithoutSlip}
                />

                <PickCorrectionsModal
                    visible={slipVisible}
                    parlay={parlay}
                    locking={true}
                    dismissModal={() => setSlipVisible(false)}
                    onSubmitted={handleSlipSubmitted}
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
