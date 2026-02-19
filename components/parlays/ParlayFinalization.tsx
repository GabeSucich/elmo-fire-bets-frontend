import { ParlayResponseData, ParlayResult, ParlaysService } from "@/api";
import React, { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import ErrorView from "../reusable/ErrorView";
import ActionButton from "../reusable/ActionButton";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import { ParlayCard } from "./ParlayCard";
import { setApiErrorMsg } from "@/util/error";
import SelectableTileGroup from "../reusable/tiles/SelectableTileGroup";
import { PickResultColors } from "@/util/pickResults";
import OverlayLoader from "../reusable/OverlayLoader";
import { useParlaysContext } from "@/contexts/parlaysContext";
import { useErrorLoadingStates } from "@/composables/useErrorLoadingStates";
import useApiActionState from "@/composables/useApiActionState";

type Props = {
    parlay: ParlayResponseData
    onDone: () => void
}

export default function ParlayFinalization({ parlay, onDone }: Props) {

    const {
        error, loading, setError, setLoading
    } = useErrorLoadingStates()

    const {
        refreshParlays,
        navToTab,
        setFocusedParlayId
    } = useParlaysContext()

    const [finalizedParlay, setFinalizedParlay] = useState<ParlayResponseData | null>(null)
    const [possibleResults, setPossibleResults] = useState<ParlayResult[]>([])
    const [selectedResult, setSelectedResult] = useState<ParlayResult | null>(null)
    
    const allPicksHaveResults = parlay.picks.every(pick => !!pick.result)

    const {
        execute: finalizeParlay
    } = useApiActionState(
        () => ParlaysService.finalizeParlayResult(parlay.id, {}),
        res => {
            setFinalizedParlay(res.parlay),
            setPossibleResults(res.possible_results)
        },
        setLoading,
        setError,
        "There was an error computing parlay results"
    )

    const {
        execute: closeParlay
    } = useApiActionState(
        (result: ParlayResult) => ParlaysService.closeParlay(parlay.id, {parlay_result: result}),
        res => {
            refreshParlays()
            navToTab("Closed")
            setFocusedParlayId(parlay.id)
            onDone()
        },
        setLoading,
        setError,
        "There was an error closing the parlay"
    )
    

    function handleFinalizeParlay() {
        setFinalizedParlay(null)
        setPossibleResults([])
        setSelectedResult(null)
        finalizeParlay()
    }

    if (!allPicksHaveResults) {
        return (
            <ErrorView errorMsg={"You must enter a result for all picks before finalizing the parlay"}/>
        )
    }
    
    return (
        <View>
            {loading && <OverlayLoader />}
            <ParlayCard pickTileSize="xs" parlay={finalizedParlay || parlay} editable={false} hideFooter={true} disableResultEditing={true}/>
            <View style={{alignItems: "flex-end", marginBottom: 10}}>
                <ActionButton text="Compute Possible Results" onPress={handleFinalizeParlay} />
            </View>
            {
                finalizedParlay && possibleResults.length > 0 && (
                    <View style={{alignContent: "center"}}>
                        <Text style={{fontStyle: "italic", marginBottom: 10}}>Possible results. Go back and edit picks if this does not look right.</Text>
                        <SelectableTileGroup<ParlayResult>
                            selectedItem={selectedResult}
                            items={possibleResults}
                            itemDisplay={r => r}
                            itemStyle={r => ({primaryColor: PickResultColors[r]})}
                            itemKey={r => `possible-result-${r}`}
                            handleSelect={r => setSelectedResult(r)}
                            containerProps={{alignItems: "center"}}
                        />
                        {
                            selectedResult &&
                                <View style={{marginTop: 10, marginLeft: "auto"}}>
                                    <ActionButton text="Save Result" onPress={() => closeParlay(selectedResult)} />
                                </View>
                        }
                    </View>
                )
            }
            {
                finalizedParlay && possibleResults.length === 0 && (
                    <View style={{alignContent: "center", paddingVertical: 10}}>
                        <Text 
                        style={{fontStyle: "italic", color: "red", marginBottom: 10}}>
                            No possible results. Something went wrong.
                        </Text>
                    </View>
                )
            }
        </View>
    )

}