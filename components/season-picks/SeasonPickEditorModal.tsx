import React, { useEffect, useRef, useState } from "react"
import { ActivityIndicator, Text, TextInput, View } from "react-native"
import {
    PropBetDirection,
    PropBetType,
    SeasonPickKind,
    SeasonPickRequestData,
    SeasonPickResponseData,
} from "@/api"
import AppModal from "@/components/reusable/AppModal"
import DismissKeyboardBackdrop from "@/components/reusable/DismissKeyboardBackdrop"
import ActionButton from "@/components/reusable/ActionButton"
import NumericInput from "@/components/reusable/NumericInput"
import OverlayLoader from "@/components/reusable/OverlayLoader"
import SelectableTile from "@/components/reusable/tiles/SelectableTile"
import SelectableTileGroup from "@/components/reusable/tiles/SelectableTileGroup"
import {
    PlayerTeamResult,
    executePlayerTeamSearch,
    playerTeamDisplay,
    playerTeamResultToRequestData,
} from "@/util/executePlayerSearch"
import { colors, shadows, spacing, typography } from "@/theme/colors"
import { makeSortedSeasonBetTypes } from "@/util/betTypes"

type Props = {
    visible: boolean
    gamblerId: number
    gamblerName: string
    /** Set when editing; null when adding. */
    pick: SeasonPickResponseData | null
    saving: boolean
    onClose: () => void
    onSubmit: (body: SeasonPickRequestData) => void
}

/** Rebuilds the search result shape from a saved pick, so editing starts pre-selected. */
function targetOf(pick: SeasonPickResponseData | null): PlayerTeamResult | null {
    if (!pick) return null
    return {
        identifier: pick.prop_bet_target.identifier,
        playerName: pick.prop_bet_target.player_name,
        teamName: pick.prop_bet_target.team_name,
    }
}

function Label({ children }: { children: React.ReactNode }) {
    return (
        <Text style={{
            ...typography.caption,
            color: colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: spacing.xs,
        }}>
            {children}
        </Text>
    )
}

export default function SeasonPickEditorModal(props: Props) {
    const [kind, setKind] = useState<SeasonPickKind>(props.pick?.kind ?? SeasonPickKind.PLAYER_PROP)
    const [target, setTarget] = useState<PlayerTeamResult | null>(targetOf(props.pick))
    const [options, setOptions] = useState<PlayerTeamResult[]>([])
    const [searchText, setSearchText] = useState("")
    const [searching, setSearching] = useState(false)
    const [propType, setPropType] = useState<PropBetType | null>(props.pick?.prop_type ?? null)
    const [direction, setDirection] = useState<PropBetDirection | null>(props.pick?.direction ?? null)
    const [line, setLine] = useState(props.pick ? String(props.pick.line) : "")

    const latestTerm = useRef("")
    const timeoutId = useRef<number | null>(null)

    // Reset whenever the modal is opened for a different pick, so an edit never
    // inherits the previous one's half-filled state.
    useEffect(() => {
        if (!props.visible) return
        setKind(props.pick?.kind ?? SeasonPickKind.PLAYER_PROP)
        setPropType(props.pick?.prop_type ?? null)
        setDirection(props.pick?.direction ?? null)
        setLine(props.pick ? String(props.pick.line) : "")
        setTarget(targetOf(props.pick))
        setOptions([])
        setSearchText("")
    }, [props.visible, props.pick])

    useEffect(() => {
        if (!searchText) return
        if (timeoutId.current) window.clearTimeout(timeoutId.current)
        // Spins from the keystroke rather than the request, so the debounce does not
        // read as the app having ignored you.
        setSearching(true)
        timeoutId.current = window.setTimeout(() => {
            const term = searchText
            latestTerm.current = term
            executePlayerTeamSearch(term)
                .then(results => {
                    if (latestTerm.current !== term) return
                    // A team win total can only be taken on a team.
                    setOptions(kind === SeasonPickKind.TEAM_WINS
                        ? results.filter(r => r.playerName === null)
                        : results)
                    setSearching(false)
                })
                .catch(() => {
                    if (latestTerm.current === term) setSearching(false)
                })
        }, 600)
    }, [searchText, kind])

    const teamWins = kind === SeasonPickKind.TEAM_WINS
    const ready = target !== null && direction !== null && line !== "" && !isNaN(Number(line))
        && (teamWins || propType !== null)

    function submit() {
        if (!ready) return
        props.onSubmit({
            gambler_id: props.gamblerId,
            kind,
            target: playerTeamResultToRequestData(target!),
            prop_type: teamWins ? null : propType,
            line: Number(line),
            direction: direction!,
        })
    }

    return (
        <AppModal visible={props.visible} animationType="fade" transparent onRequestClose={props.onClose}>
            <DismissKeyboardBackdrop style={{
                flex: 1, justifyContent: "center", alignItems: "center",
                backgroundColor: colors.overlay, padding: spacing.lg,
            }}>
                <View style={{
                    width: "100%", maxHeight: "85%",
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: 20, padding: spacing.xl,
                    borderWidth: 1, borderColor: colors.cardBorder,
                    gap: spacing.md,
                    ...shadows.modal,
                }}>
                    <Text style={{ ...typography.heading, color: colors.textPrimary }}>
                        {props.pick ? "Edit" : "Add"} season pick — {props.gamblerName}
                    </Text>

                    <View>
                        <Label>Type</Label>
                        <View style={{ flexDirection: "row", gap: spacing.sm }}>
                            <SelectableTile
                                item={SeasonPickKind.PLAYER_PROP}
                                isSelected={!teamWins}
                                handleSelect={() => { setKind(SeasonPickKind.PLAYER_PROP); setTarget(null) }}
                                display="Player prop"
                                size="sm"
                            />
                            <SelectableTile
                                item={SeasonPickKind.TEAM_WINS}
                                isSelected={teamWins}
                                handleSelect={() => { setKind(SeasonPickKind.TEAM_WINS); setTarget(null); setPropType(null) }}
                                display="Team wins"
                                size="sm"
                            />
                        </View>
                    </View>

                    <View>
                        <Label>{teamWins ? "Team" : "Player or team"}</Label>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <TextInput
                                value={searchText}
                                onChangeText={setSearchText}
                                placeholder={teamWins ? "Team" : "Player or Team"}
                                // See PickEditor: autocorrect rewrites surnames as you type.
                                autoCorrect={false}
                                spellCheck={false}
                                placeholderTextColor={colors.textMuted}
                                style={{
                                    borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 10,
                                    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                                    flex: 1, marginRight: spacing.sm,
                                    color: colors.textPrimary, backgroundColor: colors.inputBackground,
                                }}
                            />
                            {/* Fixed width so the input does not resize as the spinner comes and goes. */}
                            <View style={{ width: 20, marginRight: spacing.sm, alignItems: "center" }}>
                                {searching && <ActivityIndicator size="small" color={colors.accent} />}
                            </View>
                            {/* Shown as a selected tile, matching the parlay pick editor. */}
                            {target && (
                                <SelectableTile
                                    isSelected={true}
                                    item={target}
                                    handleSelect={() => {}}
                                    display={playerTeamDisplay}
                                    size="sm"
                                />
                            )}
                        </View>
                        <SelectableTileGroup<PlayerTeamResult>
                            selectedItem={target}
                            items={options.filter(o => o.identifier !== target?.identifier)}
                            handleSelect={setTarget}
                            itemDisplay={playerTeamDisplay}
                            itemKey={t => t.identifier}
                            containerProps={{ marginTop: spacing.sm }}
                            tileSize="sm"
                        />
                    </View>

                    {!teamWins && (
                        <View>
                            <Label>Prop</Label>
                            <SelectableTileGroup<PropBetType>
                                selectedItem={propType}
                                items={makeSortedSeasonBetTypes()}
                                handleSelect={setPropType}
                                itemDisplay={p => p}
                                itemKey={p => p}
                                tileSize="sm"
                            />
                        </View>
                    )}

                    <View>
                        <Label>{teamWins ? "Wins" : "Line"}</Label>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                            <SelectableTile
                                item="Over"
                                isSelected={direction === PropBetDirection.OVER}
                                handleSelect={() => setDirection(PropBetDirection.OVER)}
                                display="Over"
                                size="sm"
                                tileStyles={{ primaryColor: colors.success }}
                            />
                            <SelectableTile
                                item="Under"
                                isSelected={direction === PropBetDirection.UNDER}
                                handleSelect={() => setDirection(PropBetDirection.UNDER)}
                                display="Under"
                                size="sm"
                                tileStyles={{ primaryColor: colors.danger }}
                            />
                            <NumericInput
                                value={line}
                                onChangeText={setLine}
                                placeholder={teamWins ? "9.5" : "1100"}
                                style={{
                                    borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 10,
                                    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                                    minWidth: 90, color: colors.textPrimary,
                                    backgroundColor: colors.inputBackground,
                                }}
                            />
                        </View>
                    </View>

                    <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: spacing.md }}>
                        <ActionButton text="Cancel" onPress={props.onClose} color={colors.buttonSecondary} />
                        <ActionButton
                            text={props.pick ? "Save" : "Add pick"}
                            onPress={submit}
                            color={ready && !props.saving ? colors.accent : colors.buttonSecondary}
                        />
                    </View>

                    {props.saving && <OverlayLoader loaderProps={{ size: 24 }} />}
                </View>
            </DismissKeyboardBackdrop>
        </AppModal>
    )
}
