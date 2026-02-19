import { PickResponseData, PropBetDirection, PropBetType, SauceFactor } from "@/api";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import { makeSortedBetTypes } from "@/util/betTypes";
import { executePlayerTeamSearch, playerTeamDisplay, PlayerTeamResult } from "@/util/executePlayerSearch";
import React, { useEffect, useMemo, useState } from "react";
import { Pressable, Switch, Text, TextInput, View } from "react-native";
import SelectableTile from "../reusable/tiles/SelectableTile";
import SelectableTileGroup from "../reusable/tiles/SelectableTileGroup";
import { PickCreateEditData } from "./common";
import { getPickLine } from "@/util/picks";

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
    const sortedBetTypes = makeSortedBetTypes()

    const initialTarget = props.pick ? getPlayerTeamResult(props.pick) : null
    const [selectedTarget, setSelectedTarget] = useState<PlayerTeamResult | null>(initialTarget)
    const [targetOpts, setTargetOpts] = useState<PlayerTeamResult[]>(initialTarget ? [initialTarget] : [])
    const [executeSearchTimeoutId, setExecuteSearchTimeoutId] = useState<number | null>(null)
    const [searchText, setSearchText] = useState("")

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
        executePlayerTeamSearch(searchText).then(result => {
            setTargetOpts(result)
        })
    }

    useEffect(() => {
        if (searchText) {
            clearExistingSearch()
            const timeoutId = window.setTimeout(executeSearchOnTerm, 600)
            setExecuteSearchTimeoutId(timeoutId)
        }
    }, [searchText])

    function handleSearchChange(text: string) {
        const trimmed = text.trim()
        if (!trimmed) {
            clearExistingSearch()
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
        <View style={{padding: 10}}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <TextInput
                    value={searchText}
                    onChangeText={handleSearchChange}
                    placeholder="Player or Team"
                    style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, flex: 1, marginRight: 8 }}
                />
                {selectedTarget && (
                    <SelectableTile
                        isSelected={true}
                        item={selectedTarget}
                        handleSelect={() => {}}
                        display={playerTeamDisplay}
                        size="md"
                    />
                )}
            </View>
            <SelectableTileGroup<PlayerTeamResult>
                selectedItem={selectedTarget}
                items={targetOpts.filter(t => t.identifier !== selectedTarget?.identifier)}
                handleSelect={t => setSelectedTarget(t)}
                itemDisplay={playerTeamDisplay}
                itemKey={t => t.identifier}
                containerProps={{
                    marginTop: 10
                }}
                tileSize="sm"
            />

            <View style={{ height: 1, backgroundColor: '#ccc', marginVertical: 16 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <SelectableTile
                    item={"Over"}
                    key={"Over"}
                    isSelected={selectedDirection === PropBetDirection.OVER}
                    handleSelect={() => setSelectedDirection(PropBetDirection.OVER)}
                    display={"Over"}
                    size="md"
                />
                <SelectableTile
                    item={"Under"}
                    key={"Under"}
                    isSelected={selectedDirection === PropBetDirection.UNDER}
                    handleSelect={() => setSelectedDirection(PropBetDirection.UNDER)}
                    display={"Under"}
                    size="md"
                />
                <TextInput
                    value={propLine}
                    onChangeText={setPropLine}
                    placeholder="Line"
                    keyboardType="numeric"
                    style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, width: 80 }}
                />
            </View>

            <View style={{ height: 1, backgroundColor: '#ccc', marginVertical: 16 }} />

            <SelectableTileGroup<PropBetType>
                selectedItem={selectedBetType}
                itemKey={bt => bt}
                items={sortedBetTypes}
                handleSelect={bt => setSelectedBetType(bt)}
                itemDisplay={bt => bt}
                raiseSelection={false}
                noScroll={true}
                tileSize="sm"
            />

            <View style={{ height: 1, backgroundColor: '#ccc', marginVertical: 16 }} />

            <SelectableTileGroup<SauceFactor>
                selectedItem={selectedSauceFactor}
                items={[SauceFactor.SPICY, SauceFactor.BITCH]}
                itemDisplay={s => s}
                itemKey={s => s}
                itemStyle={s => {
                    if (s === SauceFactor.SPICY) return {primaryColor: "red"}
                    return { primaryColor: "purple"}
                }}
                handleSelect={s => setSelectedSauceFactor(s)}
                handleUnselect={() => setSelectedSauceFactor(null)}
                tileSize="md"
                containerProps={{alignItems: "center"}}
            />

            {props.showDeleteVetoOption && veto && vetoerName && (
                <>
                    <View style={{ height: 1, backgroundColor: '#ccc', marginVertical: 16 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ flex: 1, fontSize: 13, color: '#333', marginRight: 12 }}>
                            {vetoerName} has a {veto.approval_status.toLowerCase()} veto applied to this pick. Delete it? This action is irreversible.
                        </Text>
                        <Switch
                            value={deleteVeto}
                            onValueChange={setDeleteVeto}
                            trackColor={{ false: '#ccc', true: '#dc2626' }}
                        />
                    </View>
                </>
            )}

            <View style={{ height: 1, backgroundColor: '#ccc', marginVertical: 16 }} />

            <Pressable onPress={() => handleSubmit()} disabled={!canSubmit}>
                <View style={{
                    backgroundColor: canSubmit ? '#3b82f6' : '#a0a0a0',
                    borderRadius: 8,
                    paddingVertical: 12,
                    alignItems: 'center',
                    opacity: canSubmit ? 1 : 0.6
                }}>
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>{submitLabel()}</Text>
                </View>
            </Pressable>
        </View>
    )
}
