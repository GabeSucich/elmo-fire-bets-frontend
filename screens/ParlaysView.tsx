import React, { act, useEffect, useState } from "react"
import { useListParlays } from "@/composables/useListParlays"
import { View, TouchableOpacity, StyleSheet, Modal } from "react-native"
import ParlayTabButtons from "@/components/reusable/TabButtons"
import ParlaysList from "@/components/parlays/ParlaysList"
import ParlayEditCard from "@/components/parlays/ParlayEditCard"
import { GetSeasonParlaysSortParam, ParlaysService, ParlayState } from "@/api"
import { setApiErrorMsg } from "@/util/error"
import { ParlaysProvider } from "@/contexts/parlaysContext"
import { ParlayEditArgs } from "@/components/parlays/common"
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import Ionicons from "react-native-vector-icons/Ionicons"
import FontAwesome from "react-native-vector-icons/FontAwesome"

export type ParlayTab = "Building" | "Open" | "Closed" | "My Lays"

interface Props {
    seasonId: number
}

export default function ParlaysView(props: Props) {

    const { gamblerId } = useGamblingSeasonContext()

    const [generalLoading, setGeneralLoading] = useState(false)
    const [generalError, setGeneralError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<ParlayTab>("Building")
    const [isModalVisible, setIsModalVisible] = useState(false)

    const {
        parlays: buildingParlays,
        loadNextParlays: loadNextBuildingParlays,
        canLoadMore: canLoadMoreBuilding,
        bulkLoading: buildingLoading,
        bulkError: buildingError,
        refreshParlays: refreshBuildingParlays,
        refreshParlay: refreshBuildingParlay,
        parlayLoadingStates: buildingParlayLoadingStates,
        swapParlays: swapBuildingParlays
    } = useListParlays(props.seasonId, ParlayState.BUILDING)

    const {
        parlays: openParlays,
        loadNextParlays: loadNextOpenParlays,
        canLoadMore: canLoadMoreOpen,
        bulkLoading: openLoading,
        bulkError: openError,
        refreshParlays: refreshOpenParlays,
        parlayLoadingStates: openParlayLoadingStates,
        refreshParlay: refreshOpenParlay
    } = useListParlays(props.seasonId, ParlayState.OPEN)

    const {
        parlays: closedParlays,
        loadNextParlays: loadNextClosedParlays,
        canLoadMore: canLoadMoreClosed,
        bulkLoading: closedLoading,
        bulkError: closedError,
        refreshParlays: refreshClosedParlays,
        parlayLoadingStates: closedParlayLoadingStates,
        refreshParlay: refreshClosedParlay,
    } = useListParlays(props.seasonId, ParlayState.CLOSED, {sort: GetSeasonParlaysSortParam.DESC})

    function myLays() {
        return openParlays.filter(lay => lay.owner_id === gamblerId)
    }

    function VisibleParlays() {
        if (activeTab == "Building") {
            return <ParlaysList
                key={`parlays-list`}
                parlays={buildingParlays}
                loadMore={loadNextBuildingParlays}
                canLoadMore={canLoadMoreBuilding}
                loadingAll={buildingLoading}
                error={buildingError}
                editable={true}
                loadingStates={buildingParlayLoadingStates}
            />
        } else if (activeTab === "Closed") {
            return <ParlaysList
                key={`parlays-list`}
                parlays={closedParlays}
                loadMore={loadNextClosedParlays}
                canLoadMore={canLoadMoreClosed}
                loadingAll={closedLoading}
                error={closedError}
                editable={false}
                loadingStates={closedParlayLoadingStates}
            />
        } else if (activeTab === "Open") {
            return <ParlaysList
                key={`parlays-list`}
                parlays={openParlays}
                loadMore={loadNextOpenParlays}
                canLoadMore={canLoadMoreOpen}
                loadingAll={openLoading}
                error={openError}
                editable={false}
                loadingStates={openParlayLoadingStates}
            />
        } else if (activeTab === "My Lays") {
            return <ParlaysList
                key={`parlays-list`}
                parlays={myLays()}
                loadMore={loadNextOpenParlays}
                canLoadMore={canLoadMoreOpen}
                loadingAll={openLoading}
                error={openError}
                editable={false}
                loadingStates={openParlayLoadingStates}
            />
        }
    }

    function createParlay(args: ParlayEditArgs) {
        return ParlaysService.createParlay({
            gambling_season_id: props.seasonId,
            slate_type: args.slateType,
            competition_date: args.competitionDate,
            owner_id: args.ownerId,
            wager_pp: args.wagerPp
        }).then(res => {
            refreshBuildingParlays()
            setIsModalVisible(false)
        }).catch(err => {
            setApiErrorMsg(err, setGeneralError, "Error creating new parlay")
        }).finally(() => setGeneralLoading(false))
    }

    function refreshAllParlays() {
        refreshBuildingParlays()
        refreshOpenParlays()
        refreshClosedParlays()
    }

    function refreshParlay(parlayId: number) {
        if (buildingParlays.some(p => p.id === parlayId)) {
            return refreshBuildingParlay(parlayId)
        } else if (openParlays.some(p => p.id === parlayId)){
            return refreshOpenParlay(parlayId)
        } else if (closedParlays.some(p => p.id === parlayId)) {
            return refreshClosedParlay(parlayId)
        }
    }

    return (
        <ParlaysProvider 
            refreshParlays={refreshAllParlays}
            refreshParlay={refreshParlay}
            navToTab={setActiveTab}
            swapParlays={swapBuildingParlays}
        >
            <View style={styles.container}>
            <View style={styles.topButtons}>
                {activeTab === "Building" && (
                    <TouchableOpacity onPress={() => setIsModalVisible(true)}>
                        <Ionicons name="add-circle" size={24} color="#007AFF" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={refreshAllParlays}>
                    <FontAwesome name="refresh" size={20} color="#007AFF" />
                </TouchableOpacity>
            </View>
            <ParlayTabButtons<ParlayTab>
                tabs={["Building", "Open", "Closed", "My Lays"]}
                setActiveTab={setActiveTab}
                activeTab={activeTab}
                getDisplay={t => t === "My Lays" ? `${t} (${myLays().length})` : t}
                getKey={t => t}
                size="sm"
            />
            {VisibleParlays()}
            <Modal
                visible={isModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setIsModalVisible(false)}
                >
                    <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.modalContent}>
                        <ParlayEditCard
                            handleEdit={createParlay}
                        />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
        </ParlaysProvider>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topButtons: {
        position: "absolute",
        top: 8,
        right: 12,
        zIndex: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        width: "100%",
        maxWidth: 400,
    },
})
