import { ParlayResponseData } from "@/api";
import { ParlayCard } from "@/components/parlays/ParlayCard";
import React, { useEffect, useRef, useState } from "react";
import { Button, FlatList, Pressable, Text, View } from "react-native";
import ActivityLoader from "../reusable/ActivityLoader";
import OverlayLoader from "../reusable/OverlayLoader";
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

    function handleLoadMore() {
        if (props.canLoadMore) {
            props.loadMore()
        }
    }

    function tryScrollToIndex(index: number) {
        setTimeout(() => {
            listRef?.current?.scrollToIndex({index, animated: true})
        }, 200)
    }

    useEffect(() => {
        if (focusedParlayId === null) return
        if (props.loadingAll) return
        const focusedParlayIndex = props.parlays.map(p => p.id).indexOf(focusedParlayId)
        if (focusedParlayIndex >= 0) {
            tryScrollToIndex(focusedParlayIndex)
            setFocusedParlayId(null)
        }
    }, [props.parlays])

    if (props.loadingAll && props.parlays.length === 0) {
        return <ActivityLoader text="Loading parlays..." />
    }

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                ref={listRef}
                onScroll={() => setFocusedParlayId(null)}
                onScrollToIndexFailed={(info) => {
                    setTimeout(() => {
                        console.log("FAILING")
                        listRef?.current?.scrollToIndex({ index: info.index, animated: true })
                    }, 200)
                }}
                data={props.parlays}
                keyExtractor={(parlay) => String(parlay.id)}
                renderItem={(parlay) => {
                    const isLoading = parlayIsLoading(parlay.item.id)
                    return (
                        <View>
                            <ParlayCard parlay={parlay.item} editable={props.editable} />
                            {isLoading && (
                                <OverlayLoader loaderProps={{ name: "BallPulseSync" }} />
                            )}
                        </View>
                    )
                }}
                ListFooterComponent={() => {
                    if (props.loadingAll && props.parlays.length > 0) {
                        return <ActivityLoader size={20} text="Loading more..."/>
                    }
                    if (props.canLoadMore) {
                        return <Pressable onPress={handleLoadMore} style={{ alignItems: 'center', paddingVertical: 12 }}><Text style={{ color: '#007AFF', fontSize: 14, fontWeight: '500' }}>Load more</Text></Pressable>
                    }
                }}
            />
        </View>
    )
}
