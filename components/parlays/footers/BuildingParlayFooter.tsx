import { ParlayResponseData, ParlayState, VetoApprovalStatus } from "@/api";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import React, { useState } from "react";
import { View } from "react-native";
import LockConfirmModal from "../modals/LockConfirmModal";
import PickCorrectionsModal from "../modals/PickCorrectionsModal";
import ClaimConfirmModal from "../modals/ClaimConfirmModal";
import PendingVetoConfirmModal from "../modals/PendingVetoConfirmModal";
import ParlayAssessmentModal from "../modals/ParlayAssessmentModal";
import ActionButton from "../../reusable/ActionButton";
import { useParlaysContext } from "@/contexts/parlaysContext";
import { colors, spacing } from "@/theme/colors";

/** Mirrors MIN_PICKS in services/assessments/service.py. */
const MIN_ANALYSIS_PICKS = 3

type Props = {
    parlay: ParlayResponseData
}

export default function BuildingParlayFooter({ parlay }: Props) {
    const [lockConfirmVisible, setLockConfirmVisible] = useState(false)
    const [slipVisible, setSlipVisible] = useState(false)
    const [vetoConfirmVisible, setVetoConfirmVisible] = useState(false)
    const [claimConfirmVisible, setClaimConfirmVisible] = useState(false)
    const [assessmentVisible, setAssessmentVisible] = useState(false)

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

    // Open to anyone in the season, owner or not: it only says things. Not offered below
    // three picks, which is the server's minimum — fewer is not much of a slate.
    // Bottom left, apart from the lay's own actions on the right: the auto margin pushes it
    // there and leaves the row right-aligned when it is not shown.
    const assessButton = parlay.picks.length >= MIN_ANALYSIS_PICKS ? (
        <View style={{ marginRight: 'auto' }}>
            <ActionButton
                icon="flask"
                iconColor={colors.success}
                accessibilityLabel="Pick analysis"
                onPress={() => setAssessmentVisible(true)}
                color={colors.buttonSecondary}
            />
        </View>
    ) : null
    const assessmentModal = (
        <ParlayAssessmentModal
            visible={assessmentVisible}
            parlay={parlay}
            dismissModal={() => setAssessmentVisible(false)}
        />
    )

    if (isMyOwnedParlay) {
        return (
            <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
                marginTop: spacing.md, gap: spacing.sm,
            }}>
                {assessButton}
                {assessmentModal}
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
        <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
            marginTop: spacing.md, gap: spacing.sm,
        }}>
            {assessButton}
            {assessmentModal}
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
