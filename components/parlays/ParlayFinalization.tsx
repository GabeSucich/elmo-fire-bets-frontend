import { ParlayResponseData, ParlayResult, ParlaysService } from "@/api";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Notice from "../reusable/Notice";
import ActionButton from "../reusable/ActionButton";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import { ParlayCard } from "./ParlayCard";
import { setApiErrorMsg } from "@/util/error";
import SelectableTileGroup from "../reusable/tiles/SelectableTileGroup";
import { PickResultColors } from "@/util/pickResults";
import OverlayLoader from "../reusable/OverlayLoader";
import { useParlaysContext } from "@/contexts/parlaysContext";
import { useLoadingState } from "@/composables/useLoadingState";
import useApiActionState from "@/composables/useApiActionState";
import { colors, typography, spacing } from "@/theme/colors";

type Props = {
    parlay: ParlayResponseData
    onDone: () => void
}

export default function ParlayFinalization({ parlay, onDone }: Props) {

    const {
        loading, setLoading
    } = useLoadingState()

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
            setFinalizedParlay(res.parlay)
            setPossibleResults(res.possible_results)
            // A single possible result is not a choice, so it is made rather than offered.
            setSelectedResult(res.possible_results.length === 1 ? res.possible_results[0] : null)
        },
        setLoading,
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
        "There was an error closing the parlay"
    )


    /**
     * Computed as soon as the modal opens rather than behind a button.
     *
     * There is nothing to configure and only one thing to do here, so asking for a tap
     * first was a step with no decision in it. Held in a ref because useApiActionState
     * rebuilds `finalizeParlay` every render, which would otherwise re-run this.
     */
    const finalizeRef = useRef(finalizeParlay)
    finalizeRef.current = finalizeParlay

    const computed = useRef(false)
    useEffect(() => {
        if (!allPicksHaveResults || computed.current) return
        computed.current = true
        finalizeRef.current()
    }, [allPicksHaveResults])

    if (!allPicksHaveResults) {
        return (
            <Notice message="You must enter a result for all picks before finalizing the parlay"/>
        )
    }

    return (
        <View>
            {loading && <OverlayLoader loaderProps={{ text: "Analyzing result..." }} />}
            <ParlayCard pickTileSize="xs" parlay={finalizedParlay || parlay} editable={false} disableResultEditing={true}/>
            {
                finalizedParlay && possibleResults.length > 0 && (
                    <View style={{alignContent: "center"}}>
                        {possibleResults.length > 1 && (
                            <Text style={{
                                color: colors.textPrimary,
                                fontWeight: '600',
                                textAlign: 'center',
                                marginBottom: spacing.sm,
                                ...typography.heading,
                            }}>Select the parlay result</Text>
                        )}
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
                                <View style={{marginTop: spacing.sm, marginLeft: "auto"}}>
                                    <ActionButton text="Save Result" onPress={() => closeParlay(selectedResult)} />
                                </View>
                        }
                    </View>
                )
            }
            {
                finalizedParlay && possibleResults.length === 0 && (
                    <View style={{alignContent: "center", paddingVertical: spacing.sm}}>
                        <Text
                        style={{
                            fontStyle: "italic",
                            color: colors.danger,
                            marginBottom: spacing.sm,
                            ...typography.body,
                        }}>
                            No possible results. Something went wrong.
                        </Text>
                    </View>
                )
            }
        </View>
    )

}
