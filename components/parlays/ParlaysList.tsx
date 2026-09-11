import { ParlayResponseData } from "@/api";
import { ParlayCard } from "@/components/parlays/ParlayCard";
import React, { useEffect, useRef } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import OverlayLoader from "../reusable/OverlayLoader";
import ParlayFooter from "./ParlayFooter";
import { ParlayLoadingStates } from "@/composables/useListParlays";
import { useParlaysContext } from "@/contexts/parlaysContext";
import { colors, typography, spacing } from "@/theme/colors";

type Props = {
    parlays: ParlayResponseData[]
    loadingAll: boolean,
    loadingStates: ParlayLoadingStates,
    canLoadMore: boolean,
    loadMore: () => void,
    editable: boolean
}

export default function ParlaysList(props: Props) {

    const listRef = useRef<FlatList>(null)

    const {
        focusedParlayId,
        setFocusedParlayId
    } = useParlaysContext()

    function parlayIsLoading(parlayId: number) {
        return props.loadingStates[parlayId]
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
        // Both guards belong here, not just the list. Locking a parlay refreshes and
        // then focuses, so today the focus is always set before the rows change — but an
        // effect that bails on `loadingAll` and is only woken by `props.parlays` has no
        // second chance if the order ever comes out the other way, and the scroll is
        // silently dropped. Re-running is cheap: it returns immediately without a focus,
        // and clears the focus once it has scrolled.
    }, [props.parlays, props.loadingAll, focusedParlayId, setFocusedParlayId])

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <FlatList
                ref={listRef}
                onScroll={() => setFocusedParlayId(null)}
                onScrollToIndexFailed={(info) => {
                    setTimeout(() => {
                        listRef?.current?.scrollToIndex({ index: info.index, animated: true })
                    }, 200)
                }}
                data={props.parlays}
                keyExtractor={(parlay) => String(parlay.id)}
                contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: spacing.xl }}
                renderItem={(parlay) => {
                    const isLoading = parlayIsLoading(parlay.item.id)
                    return (
                        <View>
                            <ParlayCard
                                parlay={parlay.item}
                                editable={props.editable}
                                footer={<ParlayFooter parlay={parlay.item} />}
                            />
                            {isLoading && (
                                <OverlayLoader />
                            )}
                        </View>
                    )
                }}
                ListFooterComponent={() => {
                    // canLoadMore starts true, before anything has been fetched. Without the
                    // row check the button renders over an empty list during the first load,
                    // where it reads as "Load more" sitting at the top of an empty page.
                    if (props.canLoadMore && props.parlays.length > 0 && !props.loadingAll) {
                        return (
                            <Pressable onPress={handleLoadMore} style={{ alignItems: 'center', paddingVertical: spacing.md }}>
                                <Text style={{ color: colors.accent, ...typography.body, fontWeight: '600' }}>Load more</Text>
                            </Pressable>
                        )
                    }
                }}
            />
        </View>
    )
}
