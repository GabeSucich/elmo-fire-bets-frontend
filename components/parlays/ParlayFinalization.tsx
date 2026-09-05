import { ParlayResponseData, ParlayResult, ParlaysService } from "@/api";
import React, { useState } from "react";
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
            setFinalizedParlay(res.parlay),
            setPossibleResults(res.possible_results)
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


    function handleFinalizeParlay() {
        setFinalizedParlay(null)
        setPossibleResults([])
        setSelectedResult(null)
        finalizeParlay()
    }

    if (!allPicksHaveResults) {
        return (
            <Notice message="You must enter a result for all picks before finalizing the parlay"/>
        )
    }

    return (
        <View>
            {loading && <OverlayLoader />}
            <ParlayCard pickTileSize="xs" parlay={finalizedParlay || parlay} editable={false} hideFooter={true} disableResultEditing={true}/>
            <View style={{alignItems: "flex-end", marginBottom: spacing.sm}}>
                <ActionButton text="Compute Possible Results" onPress={handleFinalizeParlay} />
            </View>
            {
                finalizedParlay && possibleResults.length > 0 && (
                    <View style={{alignContent: "center"}}>
                        <Text style={{
                            fontStyle: "italic",
                            color: colors.textSecondary,
                            marginBottom: spacing.sm,
                            ...typography.body,
                        }}>Possible results. Go back and edit picks if this does not look right.</Text>
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
