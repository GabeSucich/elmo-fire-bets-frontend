import React, { useEffect, useRef, useState } from "react"
import { ActivityIndicator, Text, TextInput, View } from "react-native"
import {
    PickListItemRequestData,
    PickListItemResponseData,
    PropBetDirection,
    PropBetType,
} from "@/api"
import AppModal from "@/components/reusable/AppModal"
import DismissKeyboardBackdrop from "@/components/reusable/DismissKeyboardBackdrop"
import ActionButton from "@/components/reusable/ActionButton"
import OverlayLoader from "@/components/reusable/OverlayLoader"
import SelectableTile from "@/components/reusable/tiles/SelectableTile"
import SelectableTileGroup from "@/components/reusable/tiles/SelectableTileGroup"
import {
    PlayerTeamResult,
    executePlayerTeamSearch,
    playerTeamDisplay,
    playerTeamResultToRequestData,
} from "@/util/executePlayerSearch"
import { ANY_DIRECTION_LABEL, ANY_PROP_LABEL } from "@/util/pickLists"
import { makeSortedBetTypes } from "@/util/betTypes"
import { colors, shadows, spacing, typography } from "@/theme/colors"

type Props = {
    visible: boolean
    listName: string
    gamblerId: number
    /** Set when editing an entry, null when adding one. */
    item: PickListItemResponseData | null
    saving: boolean
    onClose: () => void
    onSubmit: (body: PickListItemRequestData) => void
}

/** "Any prop" and "Either way" are real choices, so they need a value the tiles can hold. */
const ANY = "ANY" as const
type PropChoice = PropBetType | typeof ANY
type DirectionChoice = PropBetDirection | typeof ANY

/**
 * A saved target in the shape the search returns, so editing starts pre-selected.
 *
 * espnAthleteId is null because the response does not carry it and does not need to: the
 * target already exists and get_or_create_prop_bet_target finds it by identifier. Only a
 * target created fresh from the search has an athlete id worth passing on.
 */
function asSearchResult(target: { identifier: string, player_name: string | null, team_name: string }): PlayerTeamResult {
    return {
        identifier: target.identifier,
        playerName: target.player_name,
        teamName: target.team_name,
        espnAthleteId: null,
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

/**
 * Add or edit one entry on one list.
 *
 * One entry per pass, deliberately: an entry is one banned bet, and the same form has to
 * serve editing — a multi-select that creates five rows has nothing coherent to do when
 * reopened on one of them.
 *
 * The search is the same debounced player-or-team search the pick editor uses, over the
 * whole league rather than over a shortlist, so the name you type is found the same way
 * wherever in the app you are typing it.
 */
export default function PickListItemEditorModal(props: Props) {
    const [target, setTarget] = useState<PlayerTeamResult | null>(null)
    const [propChoice, setPropChoice] = useState<PropChoice>(ANY)
    const [directionChoice, setDirectionChoice] = useState<DirectionChoice>(ANY)
    const [searchText, setSearchText] = useState("")
    const [options, setOptions] = useState<PlayerTeamResult[]>([])
    const [searching, setSearching] = useState(false)

    const latestTerm = useRef("")
    const timeoutId = useRef<number | null>(null)

    // Reset whenever the modal opens for a different entry, so an edit never inherits the
    // last one's half-filled state.
    useEffect(() => {
        if (!props.visible) return
        setTarget(props.item ? asSearchResult(props.item.prop_bet_target) : null)
        setPropChoice(props.item?.prop_type ?? ANY)
        setDirectionChoice(props.item?.direction ?? ANY)
        setSearchText("")
        setOptions([])
    }, [props.visible, props.item])

    useEffect(() => {
        if (!searchText) return
        if (timeoutId.current) window.clearTimeout(timeoutId.current)
        // Spins from the keystroke rather than the request, so the debounce does not read
        // as the app having ignored you.
        setSearching(true)
        timeoutId.current = window.setTimeout(() => {
            const term = searchText
            latestTerm.current = term
            executePlayerTeamSearch(term)
                .then(results => {
                    if (latestTerm.current !== term) return
                    setOptions(results)
                    setSearching(false)
                })
                .catch(() => {
                    if (latestTerm.current === term) setSearching(false)
                })
        }, 600)
    }, [searchText])

    const propTypes: PropChoice[] = [ANY, ...makeSortedBetTypes()]
    const ready = target !== null

    function submit() {
        if (!ready) return
        props.onSubmit({
            gambler_id: props.gamblerId,
            target: playerTeamResultToRequestData(target),
            prop_type: propChoice === ANY ? null : propChoice,
            direction: directionChoice === ANY ? null : directionChoice,
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
                        {props.item ? "Edit" : "Add to"} {props.listName}
                    </Text>

                    <View>
                        <Label>Player or team</Label>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <TextInput
                                value={searchText}
                                onChangeText={setSearchText}
                                placeholder="Player or Team"
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
                            items={options.filter(t => t.identifier !== target?.identifier)}
                            handleSelect={setTarget}
                            itemDisplay={playerTeamDisplay}
                            itemKey={t => t.identifier}
                            containerProps={{ marginTop: spacing.sm }}
                            tileSize="sm"
                        />
                    </View>

                    <View>
                        <Label>Prop</Label>
                        <SelectableTileGroup<PropChoice>
                            selectedItem={propChoice}
                            items={propTypes}
                            handleSelect={setPropChoice}
                            itemDisplay={p => p === ANY ? ANY_PROP_LABEL : p}
                            itemKey={p => p}
                            tileSize="sm"
                        />
                    </View>

                    <View>
                        <Label>Direction</Label>
                        <View style={{ flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" }}>
                            <SelectableTile
                                item={ANY}
                                isSelected={directionChoice === ANY}
                                handleSelect={() => setDirectionChoice(ANY)}
                                display={ANY_DIRECTION_LABEL}
                                size="sm"
                            />
                            <SelectableTile
                                item={PropBetDirection.OVER}
                                isSelected={directionChoice === PropBetDirection.OVER}
                                handleSelect={() => setDirectionChoice(PropBetDirection.OVER)}
                                display="Over"
                                size="sm"
                                tileStyles={{ primaryColor: colors.success }}
                            />
                            <SelectableTile
                                item={PropBetDirection.UNDER}
                                isSelected={directionChoice === PropBetDirection.UNDER}
                                handleSelect={() => setDirectionChoice(PropBetDirection.UNDER)}
                                display="Under"
                                size="sm"
                                tileStyles={{ primaryColor: colors.danger }}
                            />
                        </View>
                        {/* Said out loud, because the rule is not obvious and getting it
                            backwards is the one way to end up with an entry that never
                            fires: banning the over says nothing about somebody's under. */}
                        <Text style={{ ...typography.caption, color: colors.textMuted, marginTop: spacing.xs }}>
                            {directionChoice === ANY
                                ? "Catches both sides of this bet."
                                : `Only ${directionChoice.toLowerCase()}s — the other side will not flag.`}
                        </Text>
                    </View>

                    <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: spacing.md }}>
                        <ActionButton text="Cancel" onPress={props.onClose} color={colors.buttonSecondary} />
                        <ActionButton
                            text={props.item ? "Save" : "Add"}
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
