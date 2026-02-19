import { ParlayResponseData, ParlaysService, ParlayState, VetoApprovalStatus } from "@/api";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import { setApiErrorMsg } from "@/util/error";
import React, { useState } from "react";
import { View } from "react-native";
import LockConfirmModal from "../modals/LockConfirmModal";
import ClaimConfirmModal from "../modals/ClaimConfirmModal";
import PendingVetoConfirmModal from "../modals/PendingVetoConfirmModal";
import ActionButton from "../../reusable/ActionButton";
import { useParlaysContext } from "@/contexts/parlaysContext";

type Props = {
    parlay: ParlayResponseData
}

export default function BuildingParlayFooter({ parlay }: Props) {
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [lockConfirmVisible, setLockConfirmVisible] = useState(false)
    const [vetoConfirmVisible, setVetoConfirmVisible] = useState(false)
    const [claimConfirmVisible, setClaimConfirmVisible] = useState(false)

    const { gamblerId, gamblers } = useGamblingSeasonContext()
    const {
        refreshParlays,
        refreshParlay,
        navToTab,
        setFocusedParlayId
    } = useParlaysContext()

    const isMyOwnedParlay = parlay.owner_id === gamblerId
    const hasPendingVeto = () => parlay.picks.some(p => p.veto?.approval_status === VetoApprovalStatus.PENDING)
    const pendingVeto = () => parlay.picks.find(p => p.veto?.approval_status === VetoApprovalStatus.PENDING)?.veto ?? null

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

    function lockParlay() {
        setLoading(true)
        setError(null)
        ParlaysService.lockParlay(parlay.id, {pick_overrides: {}})
            .then(res => {
                refreshParlays()
                navToTab("Open")
                setFocusedParlayId(parlay.id)
            })
            .catch(err => setApiErrorMsg(err, setError, "There was an error locking in the lay"))
            .finally(() => setLoading(false))
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
            <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
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
        <View style={{ alignItems: 'flex-start', marginTop: 8 }}>
            <ActionButton text={`Claim from ${ownerName}`} onPress={() => setClaimConfirmVisible(true)} />

            <ClaimConfirmModal
                visible={claimConfirmVisible}
                onCancel={() => setClaimConfirmVisible(false)}
                onConfirm={() => {
                    setClaimConfirmVisible(false)
                    claimParlay()
                }}
            />
        </View>
    )
}
