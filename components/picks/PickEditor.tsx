import { PickResponseData, PropBetDirection, PropBetType, SauceFactor } from "@/api";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import { makeSortedPlayerBetTypes, makeSortedTeamBetTypes } from "@/util/betTypes";
import { executePlayerTeamSearch, playerTeamDisplay, PlayerTeamResult } from "@/util/executePlayerSearch";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Keyboard, Pressable, Switch, Text, TextInput, View } from "react-native";
import SelectableTile from "../reusable/tiles/SelectableTile";
import SelectableTileGroup from "../reusable/tiles/SelectableTileGroup";
import NumericInput from "../reusable/NumericInput";
import { PickCreateEditData } from "./common";
import { getPickLine, sauceFactorDisplay } from "@/util/picks";
import { colors, typography, spacing, shadows } from "@/theme/colors";

type Props = {
    pick: PickResponseData | null,
    handleEdit: (data: PickCreateEditData) => void,
    submitLabel?: string,
    disabled?: boolean,
    showDeleteVetoOption?: boolean
    allowInPlaceCorrection?: boolean
    inPlaceCorrectionLabel?: string
}

function getPlayerTeamResult(pick: PickResponseData): PlayerTeamResult {
    const {
        team_name, player_name, identifier
    } = pick.prop_bet_target
    return {
        teamName: team_name,
        playerName: player_name,
        identifier
    }
}

export default function PickEditor(props: Props) {
    const initialTarget = props.pick ? getPlayerTeamResult(props.pick) : null
    const [selectedTarget, setSelectedTarget] = useState<PlayerTeamResult | null>(initialTarget)
    const [targetOpts, setTargetOpts] = useState<PlayerTeamResult[]>(initialTarget ? [initialTarget] : [])
    const [executeSearchTimeoutId, setExecuteSearchTimeoutId] = useState<number | null>(null)
    const [searchText, setSearchText] = useState("")
    const [searching, setSearching] = useState(false)
    // Guards against a slower earlier request landing after a newer one and overwriting it,
    // which would also clear the spinner while the current search is still running.
    const latestSearchTerm = useRef("")

    const [selectedDirection, setSelectedDirection] = useState<PropBetDirection | null>(props.pick?.direction ?? null)
    const [selectedBetType, setSelectedBetType] = useState<PropBetType | null>(props.pick?.prop_type ?? null)
    const [propLine, setPropLine] = useState<string>((props.pick && getPickLine(props.pick))?.toString() ?? "")
    const [selectedSauceFactor, setSelectedSauceFactor] = useState<SauceFactor | null>(props.pick?.sauce_factor ?? null)
    const [deleteVeto, setDeleteVeto] = useState(false)

    const { gamblers } = useGamblingSeasonContext()
    const veto = props.pick?.veto
    const vetoerName = veto ? gamblers[veto.gambler_id]?.firstName : null

    const targetIsDifferent = (pick: PickResponseData) => selectedTarget?.identifier !== pick.prop_bet_target.identifier
    const directionIsDifferent = (pick: PickResponseData) => selectedDirection !== pick.direction
    const lineIsDifferent = (pick: PickResponseData) => Number(propLine) !== getPickLine(pick)
    const betTypeIsDifferent = (pick: PickResponseData) => pick.prop_type !== selectedBetType
    const sauceFactorIsDifferent = (pick: PickResponseData) => pick.sauce_factor !== selectedSauceFactor

    function differentFromPick(pick: PickResponseData) {
        return targetIsDifferent(pick) || directionIsDifferent(pick) || lineIsDifferent(pick) || betTypeIsDifferent(pick) || sauceFactorIsDifferent(pick)
    }

    function allRequiredFieldsPresent() {
        return selectedTarget && selectedDirection && propLine && selectedBetType
    }

    const canSubmit = useMemo(() => {
        if (props.disabled) return false

        if (deleteVeto) return true

        if (!allRequiredFieldsPresent()) return false

        if (props.pick) {
            return differentFromPick(props.pick) || props.allowInPlaceCorrection
        }

        return true
    }, [selectedTarget, selectedDirection, propLine, selectedBetType, selectedSauceFactor, props.pick, props.disabled, deleteVeto])

    function clearExistingSearch() {
        if (executeSearchTimeoutId !== null) {
            window.clearTimeout(executeSearchTimeoutId)
        }
    }

    function executeSearchOnTerm() {
        const term = searchText
        latestSearchTerm.current = term
        executePlayerTeamSearch(term)
            .then(result => {
                if (latestSearchTerm.current !== term) return
                setTargetOpts(result)
                setSearching(false)
            })
            .catch(() => {
                if (latestSearchTerm.current === term) setSearching(false)
            })
    }

    useEffect(() => {
        if (searchText) {
            clearExistingSearch()
            // Spins from the keystroke rather than from the request, so the debounce does
            // not read as the app having ignored you.
            setSearching(true)
            const timeoutId = window.setTimeout(executeSearchOnTerm, 600)
            setExecuteSearchTimeoutId(timeoutId)
        }
    }, [searchText])

    function handleSearchChange(text: string) {
        const trimmed = text.trim()
        if (!trimmed) {
            clearExistingSearch()
            setSearching(false)
            latestSearchTerm.current = ""
            setTargetOpts(selectedTarget ? [selectedTarget] : [])
            setSearchText("")
        } else {
            clearExistingSearch()
            setSearchText(text)
        }
    }

    function handleSubmit() {
        if (!allRequiredFieldsPresent() && !deleteVeto) return
        props.handleEdit({
            playerTeamResult: selectedTarget!,
            propType: selectedBetType!,
            line: Number(propLine),
            direction: selectedDirection!,
            sauceFactor: selectedSauceFactor!,
            deleteVeto
        })
    }

    const inPlaceCorrectionLabel = () => {
        if (props.inPlaceCorrectionLabel) return props.inPlaceCorrectionLabel
        if (props.pick) return differentFromPick(props.pick) ? "Correct pick" : "Mark as correct"
        return null
    }

    const submitLabel = () => {
        if (props.submitLabel) return props.submitLabel

        return (
            props.allowInPlaceCorrection && props.pick
        ) ? inPlaceCorrectionLabel() : "Save pick"
    }

    return (
        <View style={{padding: spacing.md}}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <TextInput
                    value={searchText}
                    onChangeText={handleSearchChange}
                    placeholder="Player or Team"
                    placeholderTextColor={colors.textMuted}
                    style={{
                        borderWidth: 1,
                        borderColor: colors.inputBorder,
                        borderRadius: 10,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        flex: 1,
                        marginRight: spacing.sm,
                        color: colors.textPrimary,
                        backgroundColor: colors.inputBackground,
                    }}
                />
                {/* Fixed width so the input does not resize as the spinner comes and goes. */}
                <View style={{ width: 20, marginRight: spacing.sm, alignItems: 'center' }}>
                    {searching && <ActivityIndicator size="small" color={colors.accent} />}
                </View>
                {selectedTarget && (
                    <SelectableTile
                        isSelected={true}
                        item={selectedTarget}
                        handleSelect={() => {}}
                        display={playerTeamDisplay}
                        size="sm"
                    />
                )}
            </View>
            <SelectableTileGroup<PlayerTeamResult>
                selectedItem={selectedTarget}
                items={targetOpts.filter(t => t.identifier !== selectedTarget?.identifier)}
                handleSelect={t => {
                    // Picking one ends the search, so the keyboard has nothing left to do.
                    // keyboardShouldPersistTaps lets the tap through; it does not put the
                    // keyboard away, which is a separate thing and wanted here.
                    Keyboard.dismiss()
                    setSelectedTarget(t)
                }}
                itemDisplay={playerTeamDisplay}
                itemKey={t => t.identifier}
                containerProps={{
                    marginTop: spacing.sm
                }}
                tileSize="sm"
            />

            {selectedTarget && (
                <>
                <View style={styles.divider} />

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <SelectableTile
                        item={"Over"}
                        key={"Over"}
                        isSelected={selectedDirection === PropBetDirection.OVER}
                        handleSelect={() => setSelectedDirection(PropBetDirection.OVER)}
                        display={"Over"}
                        size="sm"
                        tileStyles={{ primaryColor: colors.success }}
                    />
                    <SelectableTile
                        item={"Under"}
                        key={"Under"}
                        isSelected={selectedDirection === PropBetDirection.UNDER}
                        handleSelect={() => setSelectedDirection(PropBetDirection.UNDER)}
                        display={"Under"}
                        size="sm"
                        tileStyles={{ primaryColor: colors.danger }}
                    />
                    <NumericInput
                        value={propLine}
                        onChangeText={setPropLine}
                        placeholder="Line"
                        placeholderTextColor={colors.textMuted}
                        style={{
                            borderWidth: 1,
                            borderColor: colors.inputBorder,
                            borderRadius: 10,
                            paddingHorizontal: spacing.md,
                            paddingVertical: spacing.sm,
                            width: 80,
                            color: colors.textPrimary,
                            backgroundColor: colors.inputBackground,
                            textAlign: 'center',
                        }}
                    />
                </View>

                <View style={styles.divider} />
                    <SelectableTileGroup<PropBetType>
                        selectedItem={selectedBetType}
                        itemKey={bt => bt}
                        items={selectedTarget.playerName ? makeSortedPlayerBetTypes() : makeSortedTeamBetTypes()}
                        handleSelect={bt => setSelectedBetType(bt)}
                        itemDisplay={bt => bt}
                        raiseSelection={false}
                        noScroll={true}
                        tileSize="sm"
                    />
                    <View style={styles.divider} />
                    <SelectableTileGroup<SauceFactor>
                        selectedItem={selectedSauceFactor}
                        items={[SauceFactor.SPICY, SauceFactor.BITCH]}
                        itemDisplay={sauceFactorDisplay}
                        itemKey={s => s}
                        itemStyle={s => {
                            if (s === SauceFactor.SPICY) return {primaryColor: "#ef4444"}
                            return { primaryColor: "#a855f7"}
                        }}
                        handleSelect={s => setSelectedSauceFactor(s)}
                        handleUnselect={() => setSelectedSauceFactor(null)}
                        tileSize="sm"
                        containerProps={{alignItems: "center"}}
                    />
                </>
            )}


            {props.showDeleteVetoOption && veto && vetoerName && (
                <>
                    <View style={styles.divider} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ flex: 1, ...typography.caption, color: colors.textSecondary, marginRight: spacing.md }}>
                            {vetoerName} has a {veto.approval_status.toLowerCase()} veto applied to this pick. Delete it? This action is irreversible.
                        </Text>
                        <Switch
                            value={deleteVeto}
                            onValueChange={setDeleteVeto}
                            trackColor={{ false: colors.cardBorder, true: colors.danger }}
                            thumbColor={colors.textPrimary}
                        />
                    </View>
                </>
            )}

            <View style={styles.divider} />

            <Pressable onPress={() => handleSubmit()} disabled={!canSubmit}>
                <View style={{
                    backgroundColor: canSubmit ? colors.accent : colors.buttonDisabled,
                    borderRadius: 12,
                    paddingVertical: spacing.md,
                    alignItems: 'center',
                    opacity: canSubmit ? 1 : 0.6,
                    ...shadows.card,
                }}>
                    <Text style={{ color: colors.textPrimary, ...typography.body }}>{submitLabel()}</Text>
                </View>
            </Pressable>
        </View>
    )
}

const styles = {
    divider: {
        height: 1,
        backgroundColor: colors.divider,
        marginVertical: spacing.lg,
    }
}
