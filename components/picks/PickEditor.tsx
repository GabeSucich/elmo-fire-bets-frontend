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
import { getPickLine, sauceFactorDisplay, sauceFactorForOdds } from "@/util/picks";
import { colors, typography, spacing, shadows } from "@/theme/colors";

/** A line lifted from a sportsbook, used to open the editor already filled in. */
export type PickPrefill = {
    target: PlayerTeamResult
    propType: PropBetType
    line: number
    direction: PropBetDirection
    /**
     * The book's price for the chosen side, as a signed string ("+105", "-130"), or null
     * where it was unpriced. Not saved with the pick — it is only here to seed the sauce.
     */
    odds: string | null
}

type Props = {
    pick: PickResponseData | null,
    /** Only read on mount — the editor owns its state once open. */
    prefill?: PickPrefill | null,
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
    // A prefill outranks whatever the pick currently holds. The two mean different things:
    // `pick` says which row is being written, `prefill` says what to write. Arriving from
    // the line browser with a pick already in the slot is a replacement, not an edit of the
    // old numbers — so the chosen line wins and the existing pick is overwritten in place
    // rather than added alongside.
    const initialTarget = props.prefill?.target ?? (props.pick ? getPlayerTeamResult(props.pick) : null)
    const [selectedTarget, setSelectedTarget] = useState<PlayerTeamResult | null>(initialTarget)
    const [targetOpts, setTargetOpts] = useState<PlayerTeamResult[]>(initialTarget ? [initialTarget] : [])
    const [executeSearchTimeoutId, setExecuteSearchTimeoutId] = useState<number | null>(null)
    const [searchText, setSearchText] = useState("")
    const [searching, setSearching] = useState(false)
    // Guards against a slower earlier request landing after a newer one and overwriting it,
    // which would also clear the spinner while the current search is still running.
    const latestSearchTerm = useRef("")

    const [selectedDirection, setSelectedDirection] = useState<PropBetDirection | null>(
        props.prefill?.direction ?? props.pick?.direction ?? null)
    const [selectedBetType, setSelectedBetType] = useState<PropBetType | null>(
        props.prefill?.propType ?? props.pick?.prop_type ?? null)
    const [propLine, setPropLine] = useState<string>(
        props.prefill?.line?.toString() ?? (props.pick && getPickLine(props.pick))?.toString() ?? "")
    // Seeded from the price when one came off the board: a line at +105 or longer is spicy
    // and one at -130 or shorter is a bitch, which is a judgement the number already makes.
    // Only ever a starting point — the chips are still there to disagree with, and a hand-
    // entered pick has no price to read, so it starts wherever it already was.
    const [selectedSauceFactor, setSelectedSauceFactor] = useState<SauceFactor | null>(
        props.prefill ? sauceFactorForOdds(props.prefill.odds) : props.pick?.sauce_factor ?? null)
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
        // The two helpers this calls are rebuilt every render, but they read only the
        // state already listed here, so naming them would recompute without ever changing
        // the answer.
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // Only the term restarts the debounce. The callbacks are rebuilt every render, so
        // depending on them would cancel and restart the 600ms wait on each keystroke's
        // re-render and the search would never fire.
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                    // Autocorrect fights a name search: iOS rewrites "Purdy" to "Purdue"
                    // and "Nacua" to "Nacho" mid-type, and the search fires on what it
                    // rewrote. spellCheck off too, so the field is not underlined in red
                    // for every surname.
                    autoCorrect={false}
                    spellCheck={false}
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
