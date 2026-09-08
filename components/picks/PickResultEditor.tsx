import React from "react"
import { BasicPickResult, PickResponseData, PickResult, PicksService, VetoApprovalStatus } from "@/api"
import { useState } from "react"
import { Text, TouchableOpacity, View } from "react-native"
import PickDisplay from "./PickDisplay"
import SelectableTileGroup from "../reusable/tiles/SelectableTileGroup"
import { getBasicPickResultColor, sortedBasicPickResults } from "@/util/pickResults"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { PickDisplayUtil } from "@/util/picks"
import OverlayLoader from "../reusable/OverlayLoader"
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import { useLoadingState } from "@/composables/useLoadingState"
import useApiActionState from "@/composables/useApiActionState"
import { colors, shadows, typography, spacing } from "@/theme/colors"

type Props = {
    pick: PickResponseData
    onUpdated: (pick: PickResponseData) => void
}

/**
 * Win and loss swap for a vetoed pick.
 *
 * The stored result is always the INITIAL pick's, and the backend derives the veto's
 * outcome from it — a losing initial pick is a good veto. The editor now asks for the
 * result of the pick as it stands after the veto, which is what the card shows, so the
 * two have to be converted at both ends. Void and push are the same either way.
 */
function flipForVeto(result: BasicPickResult): BasicPickResult {
    if (result === BasicPickResult.WIN) return BasicPickResult.LOSS
    if (result === BasicPickResult.LOSS) return BasicPickResult.WIN
    return result
}

function mapPickResult(pick: PickResponseData) {
    const result = pick.result

    switch (result) {
        case PickResult.LOSS:
        case PickResult.BOZO:
            return BasicPickResult.LOSS
        case PickResult.PUSH:
            return BasicPickResult.PUSH
        case PickResult.VOID:
            return BasicPickResult.VOID
        case PickResult.WIN:
            return BasicPickResult.WIN
        default:
            return null
    }
}

const SORTED_RESULTS = sortedBasicPickResults()

export default function PickResultEditor(props: Props) {
    const {
        loading, setLoading
    } = useLoadingState()

    const {gamblers} = useGamblingSeasonContext()

    const hasApprovedVeto = props.pick.veto?.approval_status === VetoApprovalStatus.APPROVED
    const gamblerFirstName = gamblers[props.pick.gambler_id].firstName
    const vetoerFirstName = props.pick.veto?.gambler_id ? gamblers[props.pick.veto.gambler_id]?.firstName : null

    const storedResult = mapPickResult(props.pick)
    // What the buttons represent: the outcome of the pick as it is shown, veto applied.
    const currentPickResult = storedResult && hasApprovedVeto ? flipForVeto(storedResult) : storedResult
    const [result, setResult] = useState<BasicPickResult | null>(currentPickResult)

    function buttonEnabled() {
        return !!result && result !== currentPickResult
    }

    const {
        execute: updateResult
    } = useApiActionState(
        (result: BasicPickResult) => PicksService.updatePickResult(props.pick.id, {result}),
        res => props.onUpdated(res.pick),
        setLoading,
        "There was an error updating the pick results"
    )

    function handleSubmit() {
        // Converted back to the initial pick's result, which is what the server stores.
        if (result) updateResult(hasApprovedVeto ? flipForVeto(result) : result)
    }

    return (
        <View>
            {loading && <OverlayLoader loaderProps={{text: "Updating result...", size: 20}} />}
            {/* Laid out exactly as the pick reads on the parlay card: target on the left
                with the vetoer opposite it, then the bet with whose pick it is opposite that.
                Naming the owner in a title as well was saying it twice. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{
                    color: colors.textPrimary,
                    ...typography.body,
                    fontWeight: '600',
                    flexShrink: 1,
                }}>
                    {PickDisplayUtil.playerTeamDisplay(props.pick)}
                </Text>
                {hasApprovedVeto && vetoerFirstName && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                        <MaterialCommunityIcons name="cancel" size={16} color={colors.danger} />
                        <Text style={{ ...typography.body, color: colors.danger, fontWeight: '600' }}>
                            {vetoerFirstName}
                        </Text>
                    </View>
                )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <PickDisplay pick={props.pick} showTarget={false} />
                <Text style={{ ...typography.body, color: colors.textSecondary }}>
                    {gamblerFirstName}
                </Text>
            </View>

            <SelectableTileGroup<BasicPickResult>
                selectedItem={result}
                items={SORTED_RESULTS}
                itemKey={r => `${props.pick.id}-result-${r}`}
                itemDisplay={r => r}
                handleSelect={r => setResult(r)}
                itemStyle={r => ({primaryColor: getBasicPickResultColor(r)})}
                raiseSelection={false}
                containerProps={{ alignItems: "center", marginTop: spacing.sm }}
            />
            <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: spacing.lg }} />

            <TouchableOpacity onPress={handleSubmit} disabled={!buttonEnabled()} activeOpacity={0.7}>
                <View style={{
                    backgroundColor: buttonEnabled() ? colors.accent : colors.buttonDisabled,
                    borderRadius: 12,
                    paddingVertical: spacing.md,
                    alignItems: 'center',
                    opacity: buttonEnabled() ? 1 : 0.6,
                    ...shadows.card,
                }}>
                    <Text style={{ color: colors.textPrimary, fontWeight: 'bold', ...typography.body }}>Update Result</Text>
                </View>
            </TouchableOpacity>
        </View>
    )

}
