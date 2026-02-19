import React from "react"
import { BasicPickResult, PickResponseData, PickResult, PicksService, VetoApprovalStatus } from "@/api"
import { useState } from "react"
import { Text, TouchableOpacity, View } from "react-native"
import PickDisplay from "./PickDisplay"
import SelectableTileGroup from "../reusable/tiles/SelectableTileGroup"
import { getBasicPickResultColor, sortedBasicPickResults } from "@/util/pickResults"
import OverlayLoader from "../reusable/OverlayLoader"
import ErrorView from "../reusable/ErrorView"
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import { useErrorLoadingStates } from "@/composables/useErrorLoadingStates"
import useApiActionState from "@/composables/useApiActionState"

type Props = {
    pick: PickResponseData
    onUpdated: (pick: PickResponseData) => void
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
        error, setError, loading, setLoading
    } = useErrorLoadingStates()
    
    const currentPickResult = mapPickResult(props.pick)
    const [result, setResult] = useState<BasicPickResult | null>(currentPickResult)

    const {gamblers} = useGamblingSeasonContext()

    const gamblerFirstName = gamblers[props.pick.gambler_id].firstName
    const title = `${gamblerFirstName}'s pick`

    function buttonEnabled() {
        return !!result && result !== currentPickResult
    }

    const {
        execute: updateResult
    } = useApiActionState(
        (result: BasicPickResult) => PicksService.updatePickResult(props.pick.id, {result}),
        res => props.onUpdated(res.pick),
        setLoading,
        setError,
        "There was an error updating the pick results"
    )

    function handleSubmit() {
        if (result) updateResult(result)
    }

    const hasApprovedVeto = props.pick.veto?.approval_status === VetoApprovalStatus.APPROVED
    const vetoerFirstName = props.pick.veto?.gambler_id ? gamblers[props.pick.veto.gambler_id]?.id : null
    const vetoText = !hasApprovedVeto && vetoerFirstName ? null : (
        `${gamblerFirstName} was vetoed successfuly by ${vetoerFirstName}. Enter the result for the INITIAL pick, not the vetoed pick.`
    )

    return (
        <View>
            {loading && <OverlayLoader loaderProps={{text: "Updating result...", size: 20}} />}
            <Text style={{fontWeight: "bold", alignSelf: "center", marginVertical: 8}}>{title}</Text>
            {
                hasApprovedVeto && (
                    <Text style={{fontStyle: "italic", alignSelf: "center", marginVertical: 8}}>
                        { vetoText }
                    </Text>
                )
            }
            <PickDisplay pick={props.pick} showVeto={false}/>
            <SelectableTileGroup<BasicPickResult> 
                selectedItem={result}
                items={SORTED_RESULTS}
                itemKey={r => `${props.pick.id}-result-${r}`}
                itemDisplay={r => r}
                handleSelect={r => setResult(r)}
                itemStyle={r => ({primaryColor: getBasicPickResultColor(r)})}
                raiseSelection={false}
            />
            <ErrorView errorMsg={error} />
            <View style={{ height: 1, backgroundColor: '#ccc', marginVertical: 16 }} />

            <TouchableOpacity onPress={handleSubmit} disabled={!buttonEnabled()}>
                <View style={{
                    backgroundColor: buttonEnabled() ? '#3b82f6' : '#a0a0a0',
                    borderRadius: 8,
                    paddingVertical: 12,
                    alignItems: 'center',
                    opacity: buttonEnabled() ? 1 : 0.6
                }}>
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Update Result</Text>
                </View>
            </TouchableOpacity>
        </View>
    )

}