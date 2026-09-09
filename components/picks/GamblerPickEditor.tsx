import { PickResponseData, PicksService, UpdatePickRequestData, VetoApprovalStatus } from "@/api";
import React, { useState } from "react";
import { Text, View } from "react-native";
import AppModal from "@/components/reusable/AppModal";
import OutstandingVetoCard from "../vetos/OutstandingVetoCard";
import { PickCreateEditData } from "./common";
import PickEditor, { PickPrefill } from "./PickEditor";
import { playerTeamResultToRequestData } from "@/util/executePlayerSearch";
import { useLoadingState } from "@/composables/useLoadingState";
import useApiActionState from "@/composables/useApiActionState";
import OverlayLoader from "../reusable/OverlayLoader";
import { colors, shadows, spacing, typography } from "@/theme/colors";

type Props = {
    parlayId: number,
    gamblerId: number,
    pick: PickResponseData | null
    prefill?: PickPrefill | null,
    onPickSaved: (pick: PickResponseData) => void
}

export default function GamblerPickEditor(props: Props) {
    const {
        loading: saving,
        setLoading: setSaving
    } = useLoadingState()
    const [vetoConfirmVisible, setVetoConfirmVisible] = useState(false)
    const [pendingEditData, setPendingEditData] = useState<PickCreateEditData | null>(null)

    const hasApprovedVeto = props.pick?.veto?.approval_status === VetoApprovalStatus.APPROVED

    function updateWillDeleteVeto(pick: PickResponseData, data: PickCreateEditData) {
        return !!pick.veto && (
            data.playerTeamResult.identifier !== pick.prop_bet_target.identifier ||
            data.direction !== pick.direction ||
            data.propType !== pick.prop_type
        )
    }

    function _createPick(data: PickCreateEditData) {
        return PicksService.createPick({
            parlay_id: props.parlayId,
            gambler_id: props.gamblerId,
            target: playerTeamResultToRequestData(data.playerTeamResult),
            direction: data.direction,
            line: data.line,
            sauce_factor: data.sauceFactor,
            prop_type: data.propType
        })
    }

    const {
        execute: createPick
    } = useApiActionState(
        _createPick,
        res => props.onPickSaved(res.pick),
        setSaving,
        "There was an error submitting your pick"
    )

    const {
        execute: updatePick
    } = useApiActionState(
        _updatePick,
        res => props.onPickSaved(res.pick),
        setSaving,
        "There was an error saving your pick"
    )

    function _updatePick(existingPick: PickResponseData, data: PickCreateEditData) {
        const updatePickRequest: UpdatePickRequestData = {}
        if (data.propType !== existingPick.prop_type) {
            updatePickRequest.prop_type = data.propType
        }
        if (data.direction !== existingPick.direction) {
            updatePickRequest.direction = data.direction
        }
        if (data.line !== existingPick.line) {
            updatePickRequest.line = data.line
        }
        if (data.sauceFactor !== existingPick.sauce_factor) {
            updatePickRequest.sauce_factor = data.sauceFactor
        }
        if (data.playerTeamResult.identifier !== existingPick.prop_bet_target.identifier) {
            updatePickRequest.target = {
                identifier: data.playerTeamResult.identifier,
                team_name: data.playerTeamResult.teamName,
                player_name: data.playerTeamResult.playerName
            }
        }

        return PicksService.updatePick(existingPick.id, updatePickRequest)
    }

    function handleEdit(data: PickCreateEditData) {
        if (props.pick) {
            if (updateWillDeleteVeto(props.pick, data)) {
                setPendingEditData(data)
                setVetoConfirmVisible(true)
            } else {
                updatePick(props.pick, data)
            }
        } else {
            createPick(data)
        }
    }

    return (
        <View>
            <PickEditor
                pick={props.pick}
                prefill={props.prefill}
                handleEdit={handleEdit}
                disabled={hasApprovedVeto || saving}
            />
            {saving && <OverlayLoader />}
            {hasApprovedVeto && (
                <Text style={{
                    color: colors.danger,
                    fontStyle: 'italic',
                    marginTop: spacing.sm,
                    textAlign: 'center',
                    ...typography.body,
                }}>
                    Cannot edit a pick which has an approved veto
                </Text>
            )}
            {props.pick?.veto && (
                <AppModal
                    visible={vetoConfirmVisible}
                    animationType="fade"
                    transparent={true}
                    onRequestClose={() => setVetoConfirmVisible(false)}
                >
                    <View style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: colors.overlay,
                    }}>
                        <View style={{
                            width: '85%',
                            backgroundColor: colors.backgroundSecondary,
                            borderRadius: 20,
                            padding: spacing.xl,
                            borderWidth: 1,
                            borderColor: colors.cardBorder,
                            ...shadows.modal,
                        }}>
                            <OutstandingVetoCard
                                veto={props.pick.veto}
                                pendingTransition="editing-pick"
                                onCancel={() => setVetoConfirmVisible(false)}
                                onProceed={() => {
                                    setVetoConfirmVisible(false)
                                    if (pendingEditData) {
                                        updatePick(props.pick!, pendingEditData)
                                    }
                                }}
                            />
                        </View>
                    </View>
                </AppModal>
            )}
        </View>
    )
}
