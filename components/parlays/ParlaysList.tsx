import { ParlayResponseData } from "@/api";
import { ParlayCard } from "@/components/parlays/ParlayCard";
import React, { useEffect, useRef, useState } from "react";
import { FlatList, View } from "react-native";
import ActivityLoader from "../reusable/ActivityLoader";
import ParlayFooter from "./ParlayFooter";
import { ParlayLoadingStates } from "@/composables/useListParlays";
import { useParlaysContext } from "@/contexts/parlaysContext";

type Props = {
    parlays: ParlayResponseData[]
    loadingAll: boolean,
    loadingStates: ParlayLoadingStates,
    canLoadMore: boolean,
    loadMore: () => void,
    error: string | null,
    editable: boolean
}

export default function ParlaysList(props: Props) {

    const listRef = useRef<FlatList>(null)

    const {
        focusedParlayId,
        setFocusedParlayId
    } = useParlaysContext()

    function parlayIsLoading(parlayId: number) {
        return props.loadingStates[parlayId]?.loading
    }

    function parlayError(parlayId: number) {
        return props.loadingStates[parlayId]?.error
    }

    function handleEndReached() {
        if (props.canLoadMore) {
            props.loadMore()
        }
    }

    useEffect(() => {
        if (focusedParlayId === null) return
        const focusedParlayIndex = props.parlays.map(p => p.id).indexOf(focusedParlayId)
        if (focusedParlayIndex >= 0) {
            listRef?.current?.scrollToIndex({index: focusedParlayIndex, animated: true})
            setFocusedParlayId(null)
        }
    }, [props.parlays])

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                ref={listRef}
                onScroll={() => setFocusedParlayId(null)}
                onEndReached={handleEndReached}
                data={props.parlays}
                keyExtractor={(parlay) => String(parlay.id)}
                renderItem={(parlay) => {
                    const isLoading = parlayIsLoading(parlay.item.id)
                    return (
                        <View>
                            <ParlayCard parlay={parlay.item} editable={props.editable} />
                            {isLoading && (
                                <View style={{
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: 'rgba(255,255,255,0.7)',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    borderRadius: 12,
                                }}>
                                    <ActivityLoader indicatorProps={{ size: 'small' }} />
                                </View>
                            )}
                        </View>
                    )
                }}
                ListFooterComponent={props.loadingAll ? (
                    <ActivityLoader text={props.parlays.length === 0 ? "Loading parlays..." : "Loading more parlays..."} />
                ) : null}
            />
        </View>
    )
}
