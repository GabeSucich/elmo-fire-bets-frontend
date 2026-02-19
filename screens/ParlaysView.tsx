import React, { useState } from "react"
import { useListParlays } from "@/composables/useListParlays"
import { View, TouchableOpacity, StyleSheet } from "react-native"
import ParlayTabButtons from "@/components/reusable/TabButtons"
import ParlaysList from "@/components/parlays/ParlaysList"
import { GetSeasonParlaysSortParam, ParlayState, UpdateParlayRequestData } from "@/api"
import { ParlaysProvider } from "@/contexts/parlaysContext"
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import Ionicons from "react-native-vector-icons/Ionicons"
import FontAwesome from "react-native-vector-icons/FontAwesome"
import CreateParlayModal from "@/components/parlays/modals/CreateParlayModal"

export type ParlayTab = "Building" | "Open" | "Closed" | "My Lays"

interface Props {
    seasonId: number
}

export default function ParlaysView(props: Props) {

    const { gamblerId } = useGamblingSeasonContext()

    const [activeTab, setActiveTab] = useState<ParlayTab>("Building")
    const [isModalVisible, setIsModalVisible] = useState(false)

    const {
        parlays: buildingParlays,
        loadNextParlays: loadNextBuildingParlays,
        canLoadMore: canLoadMoreBuilding,
        parlaysLoading: buildingLoading,
        parlaysError: buildingError,
        refreshParlays: refreshBuildingParlays,
        refreshParlay: refreshBuildingParlay,
        parlayLoadingStates: buildingParlayLoadingStates,
        swapParlays: swapBuildingParlays,
        deleteParlay: deleteBuildingParlay,
        claimParlay: claimBuildingParlay,
        updateParlay: updateBuildingParlay,
        lockParlay: lockBuildingParlay,
        unlockParlay: unlockBuildingParlay,
        reopenParlay: reopenBuildingParlay,
    } = useListParlays(props.seasonId, ParlayState.BUILDING)

    const {
        parlays: openParlays,
        loadNextParlays: loadNextOpenParlays,
        canLoadMore: canLoadMoreOpen,
        parlaysLoading: openLoading,
        parlaysError: openError,
        refreshParlays: refreshOpenParlays,
        parlayLoadingStates: openParlayLoadingStates,
        refreshParlay: refreshOpenParlay,
        deleteParlay: deleteOpenParlay,
        claimParlay: claimOpenParlay,
        updateParlay: updateOpenParlay,
        lockParlay: lockOpenParlay,
        unlockParlay: unlockOpenParlay,
        reopenParlay: reopenOpenParlay
    } = useListParlays(props.seasonId, ParlayState.OPEN)

    const {
        parlays: closedParlays,
        loadNextParlays: loadNextClosedParlays,
        canLoadMore: canLoadMoreClosed,
        parlaysLoading: closedLoading,
        parlaysError: closedError,
        refreshParlays: refreshClosedParlays,
        parlayLoadingStates: closedParlayLoadingStates,
        refreshParlay: refreshClosedParlay,
        deleteParlay: deleteClosedParlay,
        claimParlay: claimClosedParlay,
        updateParlay: updateClosedParlay,
        lockParlay: lockClosedParlay,
        unlockParlay: unlockClosedParlay,
        reopenParlay: reopenClosedParlay
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

    function claimParlay(parlayId: number, gamblerId: number) {
        if (buildingParlays.some(p => p.id === parlayId)) return claimBuildingParlay(parlayId, gamblerId)
        if (openParlays.some(p => p.id === parlayId)) return claimOpenParlay(parlayId, gamblerId)
        if (closedParlays.some(p => p.id === parlayId)) return claimClosedParlay(parlayId, gamblerId)
    }

    function updateParlay(request: UpdateParlayRequestData) {
        if (buildingParlays.some(p => p.id === request.parlay_id)) return updateBuildingParlay(request)
        if (openParlays.some(p => p.id === request.parlay_id)) return updateOpenParlay(request)
        if (closedParlays.some(p => p.id === request.parlay_id)) return updateClosedParlay(request)
    }

    function lockParlay(parlayId: number, afterLock: (parlayId: number) => void) {
        if (buildingParlays.some(p => p.id === parlayId)) return lockBuildingParlay(parlayId, afterLock)
        if (openParlays.some(p => p.id === parlayId)) return lockOpenParlay(parlayId, afterLock)
        if (closedParlays.some(p => p.id === parlayId)) return lockClosedParlay(parlayId, afterLock)
    }

    function unlockParlay(parlayId: number, afterUnlock: (parlayId: number) => void) {
        if (buildingParlays.some(p => p.id === parlayId)) return unlockBuildingParlay(parlayId, afterUnlock)
        if (openParlays.some(p => p.id === parlayId)) return unlockOpenParlay(parlayId, afterUnlock)
        if (closedParlays.some(p => p.id === parlayId)) return unlockClosedParlay(parlayId, afterUnlock)
    }

    function reopenParlay(parlayId: number, afterReopen: (parlayId: number) => void) {
        if (buildingParlays.some(p => p.id === parlayId)) return reopenBuildingParlay(parlayId, afterReopen)
        if (openParlays.some(p => p.id === parlayId)) return reopenOpenParlay(parlayId, afterReopen)
        if (closedParlays.some(p => p.id === parlayId)) return reopenClosedParlay(parlayId, afterReopen)
    }

    function deleteParlay(parlayId: number) {
        if (buildingParlays.some(p => p.id === parlayId)) return deleteBuildingParlay(parlayId)
        if (openParlays.some(p => p.id === parlayId)) return deleteOpenParlay(parlayId)
        if (closedParlays.some(p => p.id === parlayId)) return deleteClosedParlay(parlayId)
    }

    return (
        <ParlaysProvider 
            refreshParlays={refreshAllParlays}
            refreshParlay={refreshParlay}
            navToTab={setActiveTab}
            swapParlays={swapBuildingParlays}
            updateParlay={updateParlay}
            deleteParlay={deleteParlay}
            lockParlay={lockParlay}
            unlockParlay={unlockParlay}
            reopenParlay={reopenParlay}
            claimParlay={claimParlay}
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
            <CreateParlayModal
                visible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                seasonId={props.seasonId}
            />
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
})
