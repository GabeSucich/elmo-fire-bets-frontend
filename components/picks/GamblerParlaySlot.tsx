import { useEffect, useRef, useState } from "react"
import { ParlayResponseData, ParlayResult, ParlayState, PickResponseData, PickResult, VetoApprovalStatus, VetoResult } from "@/api"
import { Gambler, useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import { Animated, Pressable, Text, TouchableOpacity, View } from "react-native"
import { useParlaysContext } from "@/contexts/parlaysContext"
import PickDisplay from "./PickDisplay"
import VetoStatusMini from "../vetos/VetoStatusMini"
import PickEntryFlow, { PickEntrySurface } from "./PickEntryFlow"
import TeamLogo from "@/components/reusable/TeamLogo"
import PickVetoModal from "./modals/PickVetoModal"
import VetoStatusModal from "./modals/VetoStatusModal"
import PickResultEditorModal from "./modals/PickResultEditorModal"
import { PickResultColors, VetoResultColors, vetoResultDisplay } from "@/util/pickResults"
import { TileSize } from "../reusable/tiles/common"
import FeatherIcon from 'react-native-vector-icons/Feather'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import { colors, typography, spacing } from "@/theme/colors"
import { usePerformancesContext } from "@/contexts/performancesContext"
import { findBanListEntry } from "@/util/trends"
import BanListAlert from "./BanListAlert"
import PickReactionBar from "./PickReactionBar"
import PickThreadModal from "./modals/PickThreadModal"
import { usePickReactions } from "@/composables/usePickSocial"


type Props = {
    gambler: Gambler
    parlay: ParlayResponseData
    pick: PickResponseData | null
    editable: boolean
    pickTileSize?: TileSize
    allowResultEditing: boolean
    hidePickDisplay?: boolean
}

function AnimatedPickDisplay({ pick, size, hidden }: { pick: PickResponseData, size?: TileSize, hidden: boolean }) {
    const animValue = useRef(new Animated.Value(hidden ? 0 : 1)).current

    useEffect(() => {
        Animated.timing(animValue, {
            toValue: hidden ? 0 : 1,
            duration: 250,
            useNativeDriver: false,
        }).start()
    }, [hidden])

    return (
        <Animated.View style={{
            opacity: animValue,
            maxHeight: animValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 200],
            }),
            overflow: 'hidden',
        }}>
            <PickDisplay pick={pick} size={size} showTarget={false} />
        </Animated.View>
    )
}

export default function GamblerParlaySlot(props: Props) {

    const {
        gamblerId,
        gamblers
    } = useGamblingSeasonContext()

    const {
        refreshParlay,
        patchPick
    } = useParlaysContext()

    const { performanceFor } = usePerformancesContext()

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
    // Which way into the pick is showing, if either. Both adding and editing open the
    // book's board, because either way the question is which line you want — changing a
    // pick is usually swapping it for a better one rather than correcting a typo. The
    // editor is one tap away behind "Enter manually", with the existing pick still loaded.
    const [entrySurface, setEntrySurface] = useState<PickEntrySurface | null>(null)
    const [vetoModalVisible, setVetoModalVisible] = useState(false)
    const [vetoStatusVisible, setVetoStatusVisible] = useState(false)
    const [resultEditorVisible, setResultEditorVisible] = useState(false)
    const [threadVisible, setThreadVisible] = useState(false)

    // Building and Open take reactions and replies; a closed parlay is a record and shows
    // what it collected without taking more. Mirrors the 409 the server would raise anyway.
    const socialReadOnly = isClosed
    // You can argue about your own pick but not react to it — the same reason you cannot
    // vote for your own suggestion: everyone would back their own, so the chips would say
    // nothing beyond who bothered. Rendering only, deliberately: the API still accepts it,
    // and nothing here is load-bearing enough to be worth a guard on the server.
    const isOwnPick = props.pick?.gambler_id === gamblerId
    // Scoped to this slot's pick, so the drawer below never has to know its parlay.
    function patchThisPick(change: (p: PickResponseData) => PickResponseData) {
        if (props.pick) patchPick(parlayId, props.pick.id, change)
    }
    const reactions = usePickReactions(patchThisPick)

    function handlePickSaved() {
        setEntrySurface(null)
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
            return {
                text: vetoResultDisplay(pick.veto.result),
                color: VetoResultColors[pick.veto.result],
            }
        }
    }


    /**
     * What happened to the gambler whose pick this was, when it was vetoed away from them.
     * The result button beside it shows the *vetoer's* outcome, which is a different thing.
     * Rendered next to their name, so it does not repeat it.
     */
    function getVetoedExtraInfo(pick: PickResponseData): {text: string, color: string} | null {
        if (!pick.result) return null
        const veto = pick.veto
        if (veto?.approval_status !== VetoApprovalStatus.APPROVED) return null
        let text = ''
        switch (pick.result) {
            case PickResult.BOZO:
                text = '🤡'
                break;
            case PickResult.WIN:
                text = 'Win'
                break;
            case PickResult.LOSS:
                text = 'Loss'
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

    // Only while the parlay is still being built — once it is locked in, the warning is
    // just noise about a decision nobody can change.
    const banListPlacement = isBuilding && props.pick
        ? findBanListEntry(performanceFor(props.gambler.id), props.pick.prop_bet_target.id)
        : null

    return (
        <View style={{ paddingVertical: spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* The bet leads; whose bet it is sits at the foot of the slot. */}
                {props.pick ? (
                    <>
                        {/* The mark stands in for the "(ATL)" the name used to carry. On a
                            card of five picks it is the fastest way to see which games the
                            lay is spread across. */}
                        <TeamLogo team={props.pick.prop_bet_target.team_name} size={20} />
                        <Text style={{
                            color: colors.textPrimary, ...typography.body,
                            fontWeight: '600', flexShrink: 1, marginLeft: spacing.xs,
                        }}>
                            {props.pick.prop_bet_target.player_name ?? props.pick.prop_bet_target.team_name}
                        </Text>
                    </>
                ) : (
                    <Text style={{ color: colors.textMuted, ...typography.body, fontStyle: 'italic' }}>
                        No pick yet
                    </Text>
                )}
                {canCreatePick && (
                    <Pressable onPress={() => setEntrySurface("browse")}>
                        {/* A target rather than a plus: this opens the book's board, and
                            what you are doing there is picking one line out of several
                            hundred. The plus said "make a row", which is no longer the
                            first thing that happens. */}
                        <MaterialCommunityIcons
                            name="bullseye-arrow" size={18} color={colors.success}
                            style={{marginLeft: spacing.sm}}
                        />
                    </Pressable>
                )}
                {canEditPick && (
                    <Pressable onPress={() => setEntrySurface("browse")}>
                        <FeatherIcon name="edit" size={15} color={colors.accent} style={{marginLeft: spacing.sm}} />
                    </Pressable>
                )}
                {canCreateVeto() && (
                    <Pressable
                        onPress={() => setVetoModalVisible(true)}
                        style={{ marginLeft: 'auto' }}
                    >
                        <Text style={{
                            color: colors.textPrimary,
                            backgroundColor: colors.danger,
                            paddingHorizontal: spacing.sm,
                            paddingVertical: spacing.xs,
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 'bold',
                            overflow: 'hidden',
                        }}>
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
                    <View style={{
                        marginLeft: 'auto',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        flexWrap: 'wrap',
                        gap: spacing.sm,
                    }}>
                        {vetoLocked() && (
                            <VetoStatusMini veto={props.pick!.veto!} />
                        )}
                        {props.pick && (() => {
                            const result = buttonResultDisplay(props.pick)
                            // A recorded result is information and keeps its colour. A prompt to
                            // add one is just an affordance, and five filled blue buttons down the
                            // card drowned out the picks themselves — so that state is outlined.
                            const awaitingResult = result.color === PickResultColors.None
                            return (
                                <TouchableOpacity onPress={() => {props.allowResultEditing && !isClosed && setResultEditorVisible(true)}} activeOpacity={0.7}>
                                    <View style={{
                                        backgroundColor: awaitingResult ? 'transparent' : result.color,
                                        borderWidth: awaitingResult ? 1 : 0,
                                        borderColor: colors.cardBorder,
                                        paddingHorizontal: spacing.sm,
                                        paddingVertical: spacing.xs,
                                        borderRadius: 6,
                                    }}>
                                        <Text style={{
                                            color: awaitingResult ? colors.textSecondary : colors.textPrimary,
                                            fontSize: 11,
                                            fontWeight: '600',
                                        }}>
                                            { result.text }
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )
                        })()}
                    </View>
                ) : null}
            </View>
            {/* The name sits level with the bet itself, not with the block under it: it
                labels the pick, and the reactions below are a separate thing that happens
                to belong to the same slot. */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: spacing.sm,
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 }}>
                    { props.pick &&
                        <AnimatedPickDisplay pick={props.pick} size={props.pickTileSize} hidden={!!props.hidePickDisplay} />
                    }
                    {banListPlacement && (
                        <BanListAlert
                            gamblerName={displayName}
                            placement={banListPlacement}
                            isOwnPick={isMyGambler}
                        />
                    )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 0 }}>
                    {vetoedExtraInfo && (
                        <Text style={{
                            color: vetoedExtraInfo.color,
                            ...typography.caption,
                            fontWeight: '700',
                        }}>{ vetoedExtraInfo.text }</Text>
                    )}
                    <Text style={{
                        color: colors.textSecondary,
                        ...typography.caption,
                        fontWeight: '600',
                    }}>{displayName}</Text>
                </View>
            </View>
            {props.pick && !props.hidePickDisplay && (
                <PickReactionBar
                    reactions={props.pick.reactions}
                    commentCount={props.pick.comment_count}
                    readOnly={socialReadOnly}
                    isOwnPick={isOwnPick}
                    onToggle={emoji => reactions.toggle(props.pick!.id, emoji)}
                    onOpenThread={() => setThreadVisible(true)}
                />
            )}
            {props.pick && threadVisible && (
                <PickThreadModal
                    pick={props.pick}
                    gamblerName={displayName}
                    readOnly={socialReadOnly}
                    isOwnPick={isOwnPick}
                    onClose={() => setThreadVisible(false)}
                    patchPick={patchThisPick}
                />
            )}
            <PickEntryFlow
                open={entrySurface}
                date={props.parlay.competition_date}
                slateType={props.parlay.slate_type}
                pick={props.pick}
                parlayId={parlayId}
                gamblerId={props.gambler.id}
                onClose={() => setEntrySurface(null)}
                onPickSaved={handlePickSaved}
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
