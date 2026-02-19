import { PickResponseData, PicksService, UpdatePickRequestData, VetoApprovalStatus } from "@/api";
import { setApiErrorMsg } from "@/util/error";
import React, { useState } from "react";
import { Modal, Text, View } from "react-native";
import OutstandingVetoCard from "../vetos/OutstandingVetoCard";
import { PickCreateEditData } from "./common";
import PickEditor from "./PickEditor";
import { playerTeamResultToRequestData } from "@/util/executePlayerSearch";

type Props = {
    parlayId: number,
    gamblerId: number,
    pick: PickResponseData | null,
    onPickSaved: (pick: PickResponseData) => void
}

export default function GamblerPickEditor(props: Props) {
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
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

    function createPick(data: PickCreateEditData) {
        setSaving(true)
        PicksService.createPick({
            parlay_id: props.parlayId,
            gambler_id: props.gamblerId,
            target: playerTeamResultToRequestData(data.playerTeamResult),
            direction: data.direction,
            line: data.line,
            sauce_factor: data.sauceFactor,
            prop_type: data.propType
        }).then(res => {
            props.onPickSaved(res.pick)
        }).catch(error =>
            setApiErrorMsg(error, setErrorMessage, "There was an error creating your pick")
        ).finally(() => setSaving(false))
    }

    function updatePick(existingPick: PickResponseData, data: PickCreateEditData) {
        setSaving(true)
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

        PicksService.updatePick(existingPick.id, updatePickRequest)
            .then(result => {
                props.onPickSaved(result.pick)
            }).catch(e => {
                setApiErrorMsg(e, setErrorMessage, "There was an error updating picks")
            }).finally(() => setSaving(false))
    }

    function handleEdit(data: PickCreateEditData) {
        setErrorMessage(null)
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
                handleEdit={handleEdit}
                disabled={hasApprovedVeto || saving}
            />
            {hasApprovedVeto && (
                <Text style={{ color: 'red', fontStyle: 'italic', marginTop: 8, textAlign: 'center' }}>
                    Cannot edit a pick which has an approved veto
                </Text>
            )}
            {errorMessage && (
                <Text style={{ color: 'red', marginTop: 12, textAlign: 'center' }}>
                    {errorMessage}
                </Text>
            )}
            {props.pick?.veto && (
                <Modal
                    visible={vetoConfirmVisible}
                    animationType="fade"
                    transparent={true}
                    onRequestClose={() => setVetoConfirmVisible(false)}
                >
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <View style={{ width: '85%', backgroundColor: 'white', borderRadius: 10, padding: 20 }}>
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
                </Modal>
            )}
        </View>
    )
}
