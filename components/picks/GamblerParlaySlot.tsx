import { useState } from "react"
import { ParlayResponseData, ParlayResult, ParlayState, PickResponseData, PickResult, VetoApprovalStatus, VetoResult } from "@/api"
import { Gambler, useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import { Pressable, Text, TouchableOpacity, View } from "react-native"
import { useParlaysContext } from "@/contexts/parlaysContext"
import PickDisplay from "./PickDisplay"
import VetoStatusMini from "../vetos/VetoStatusMini"
import PickEditorModal from "./modals/PickEditorModal"
import PickVetoModal from "./modals/PickVetoModal"
import VetoStatusModal from "./modals/VetoStatusModal"
import PickResultEditorModal from "./modals/PickResultEditorModal"
import { PickResultColors, VetoResultColors } from "@/util/pickResults"
import { TileSize } from "../reusable/tiles/common"
import EntotypeIcon from 'react-native-vector-icons/Entypo'
import FeatherIcon from 'react-native-vector-icons/Feather'


type Props = {
    gambler: Gambler
    parlay: ParlayResponseData
    pick: PickResponseData | null
    editable: boolean
    pickTileSize?: TileSize
    allowResultEditing: boolean
}

export default function GamblerParlaySlot(props: Props) {

    const {
        gamblerId,
        gamblers
    } = useGamblingSeasonContext()

    const {
        refreshParlay
    } = useParlaysContext()
    
    const parlayId = props.parlay.id

    const isBuilding = props.parlay.state === ParlayState.BUILDING
    const isOpen = props.parlay.state === ParlayState.OPEN
    const isClosed = props.parlay.state === ParlayState.CLOSED

    const isMyGambler = gamblerId == props.gambler.id
    const isMyOwnedParlay = gamblerId == props.parlay.owner_id
    const canCreatePick = props.editable && isMyGambler && props.pick === null && isBuilding
    const canEditPick = props.editable && isBuilding && isMyGambler && props.pick !== null
    
    const canCreateVeto = () => {
        if (!isBuilding || isMyGambler || !props.pick || props.pick?.veto) return false
        const otherVetoes = props.parlay.picks.filter(p => p.id !== props.pick?.id).map(p => p.veto)
        return !otherVetoes.some(v => v && v?.approval_status !== VetoApprovalStatus.REJECTED)
    }
    
    const vetoPending = () => {
        if (!isBuilding || !props.editable) return false
        const veto = props.pick?.veto
        if (!veto) return false
        return veto.approval_status === VetoApprovalStatus.PENDING
    }

    const vetoLocked = () => {
        return props.pick?.veto?.approval_status === VetoApprovalStatus.APPROVED
    }

    const displayName = props.gambler.firstName
    const [pickEditorVisible, setPickEditorVisible] = useState(false)
    const [vetoModalVisible, setVetoModalVisible] = useState(false)
    const [vetoStatusVisible, setVetoStatusVisible] = useState(false)
    const [resultEditorVisible, setResultEditorVisible] = useState(false)

    function handlePickSaved() {
        setPickEditorVisible(false)
        refreshParlay(props.parlay.id)
    }

    function handleVetoCreated() {
        setVetoModalVisible(false)
        refreshParlay(props.parlay.id)
    }

    function buttonResultDisplay(pick: PickResponseData): {text: string, color: string} {
        if (!pick.result) {
            return {text: "Add result", color: PickResultColors.None}
        } else if (!pick.veto) {
            return {text: pick.result, color: PickResultColors[pick.result]}
        } else {
            if (!pick.veto.result) {
                return {text: "Add result", color: PickResultColors.None}
            }
            if (pick.veto.result === VetoResult.BOZO) {
                const vetoer = gamblers[pick.veto.gambler_id].firstName
                return {text: `${vetoer} ${pick.veto.result}`, color: VetoResultColors[pick.veto.result]}
            }
            return {text: pick.veto.result, color: VetoResultColors[pick.veto.result]}
        }
    }


    function getVetoedExtraInfo(pick: PickResponseData): {text: string, color: string} | null {
        if (!pick.result) return null
        const gamblerFirstName = gamblers[pick.gambler_id].firstName
        const veto = pick.veto
        if (veto?.approval_status !== VetoApprovalStatus.APPROVED) return null
        let text = ''
        switch (pick.result) {
            case PickResult.BOZO:
                text = `${gamblerFirstName} BOZO`
                break;
            case PickResult.WIN:
                text = `${gamblerFirstName} Win`
                break;
            case PickResult.LOSS:
                text = `${gamblerFirstName} Loss`
                break;
            default:
                break
        }
        if (text) {
            return {text, color: PickResultColors[pick.result]}
        }
        return null

    }

    const vetoedExtraInfo = props.pick ? getVetoedExtraInfo(props.pick) : null

    return (
        <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text>{displayName}</Text>
                {canCreatePick && (
                    <Pressable onPress={() => setPickEditorVisible(true)}>
                        <EntotypeIcon name="squared-plus" size={15} color="green" style={{marginLeft: 5}} />
                    </Pressable>
                )}
                {canEditPick && (
                    <Pressable onPress={() => setPickEditorVisible(true)}>
                        <FeatherIcon name="edit" size={15} color="blue" style={{marginLeft: 5}} />
                    </Pressable>
                )}
                {canCreateVeto() && (
                    <Pressable
                        onPress={() => setVetoModalVisible(true)}
                        style={{ marginLeft: 'auto' }}
                    >
                        <Text style={{ color: 'white', backgroundColor: '#dc2626', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, fontSize: 12, fontWeight: 'bold' }}>
                            Veto
                        </Text>
                    </Pressable>
                )}
                {vetoPending() && props.pick?.veto && (
                    <Pressable onPress={() => setVetoStatusVisible(true)} style={{ marginLeft: 'auto' }}>
                        <VetoStatusMini veto={props.pick.veto} />
                    </Pressable>
                )}
                {isBuilding && vetoLocked() && (
                    <View style={{marginLeft: 'auto'}}>
                        <VetoStatusMini veto={props.pick!.veto!} />
                    </View>
                )}
                {isOpen || isClosed ? (
                    <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        {vetoLocked() && (
                            <VetoStatusMini veto={props.pick!.veto!} />
                        )}
                        {props.pick && (
                            <TouchableOpacity onPress={() => {props.allowResultEditing && !isClosed && setResultEditorVisible(true)}}>
                                <View style={{ backgroundColor: buttonResultDisplay(props.pick).color, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                                        { buttonResultDisplay(props.pick).text }
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : null}
            </View>
            {
                vetoedExtraInfo &&
                <View style={{ alignSelf: 'flex-start', backgroundColor: vetoedExtraInfo.color, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginTop: 4 }}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                        { vetoedExtraInfo.text }
                    </Text>
                </View>
            }
            { props.pick &&
                <PickDisplay pick={props.pick} size={props.pickTileSize}/>
            }
            <PickEditorModal
                visible={pickEditorVisible}
                onClose={() => setPickEditorVisible(false)}
                pick={props.pick}
                onPickSaved={handlePickSaved}
                parlayId={parlayId}
                gamblerId={props.gambler.id}
            />
            {props.pick && (
                <PickVetoModal
                    visible={vetoModalVisible}
                    onClose={() => setVetoModalVisible(false)}
                    pick={props.pick}
                    onVetoCreated={handleVetoCreated}
                />
            )}
            {props.pick && (
                <PickResultEditorModal
                    visible={resultEditorVisible}
                    onClose={() => setResultEditorVisible(false)}
                    pick={props.pick}
                    onUpdated={() => {
                        setResultEditorVisible(false)
                        refreshParlay(props.parlay.id)
                    }}
                />
            )}
            {props.pick?.veto && (
                <VetoStatusModal
                    visible={vetoStatusVisible}
                    onClose={() => setVetoStatusVisible(false)}
                    pick={props.pick}
                    veto={props.pick.veto}
                    onVetoDeleted={() => {
                        setVetoStatusVisible(false)
                        refreshParlay(props.parlay.id)
                    }}
                    onVoteSubmitted={() => {
                        setVetoStatusVisible(false)
                        refreshParlay(props.parlay.id)
                    }}
                />
            )}
        </View>
    )
}
