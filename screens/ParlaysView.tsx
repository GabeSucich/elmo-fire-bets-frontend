import React, { useEffect, useRef, useState } from "react"
import { useListParlays } from "@/composables/useListParlays"
import { View, TouchableOpacity, StyleSheet } from "react-native"
import ParlayTabButtons from "@/components/reusable/TabButtons"
import OverlayLoader from "@/components/reusable/OverlayLoader"
import ParlaysList from "@/components/parlays/ParlaysList"
import SeasonMoneyHeader from "@/components/parlays/SeasonMoneyHeader"
import { FAB_BOTTOM, FAB_SIZE } from "@/components/parlays/common"
import { GetSeasonParlaysSortParam, ParlayState, PickResponseData, UpdateParlayRequestData } from "@/api"
import { ParlaysProvider } from "@/contexts/parlaysContext"
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import Ionicons from "react-native-vector-icons/Ionicons"
import FontAwesome from "react-native-vector-icons/FontAwesome"
import CreateParlayModal from "@/components/parlays/modals/CreateParlayModal"
import { colors, shadows, spacing } from "@/theme/colors"

export type ParlayTab = "Building" | "Open" | "Closed" | "My Lays"

interface Props {
    seasonId: number
}

export default function ParlaysView(props: Props) {

    const { gamblerId } = useGamblingSeasonContext()

    const [activeTab, setActiveTab] = useState<ParlayTab>("Building")
    const [isModalVisible, setIsModalVisible] = useState(false)
    // Whether the tab on screen is the one it should stay on: either the viewer picked it,
    // or the open list has already had its say. Building is only the opening guess.
    const tabDecided = useRef(false)

    const {
        parlays: buildingParlays,
        loadNextParlays: loadNextBuildingParlays,
        canLoadMore: canLoadMoreBuilding,
        parlaysLoading: buildingLoading,
        refreshParlays: refreshBuildingParlays,
        refreshParlay: refreshBuildingParlay,
        patchPick: patchBuildingPick,
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
        refreshParlays: refreshOpenParlays,
        parlayLoadingStates: openParlayLoadingStates,
        refreshParlay: refreshOpenParlay,
        patchPick: patchOpenPick,
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
        refreshParlays: refreshClosedParlays,
        parlayLoadingStates: closedParlayLoadingStates,
        refreshParlay: refreshClosedParlay,
        patchPick: patchClosedPick,
        deleteParlay: deleteClosedParlay,
        claimParlay: claimClosedParlay,
        updateParlay: updateClosedParlay,
        lockParlay: lockClosedParlay,
        unlockParlay: unlockClosedParlay,
        reopenParlay: reopenClosedParlay
    } = useListParlays(props.seasonId, ParlayState.CLOSED, {sort: GetSeasonParlaysSortParam.DESC})

    // Live parlays are the reason to open this screen, and they land a moment after it
    // mounts — so Building is the guess made before the answer arrives, not a preference.
    // Once, and only while the viewer has not picked a tab themselves: a switch that fired
    // later would move the screen under someone already reading it.
    useEffect(() => {
        if (tabDecided.current || openParlays.length === 0) return
        tabDecided.current = true
        setActiveTab("Open")
    }, [openParlays.length])

    function chooseTab(tab: ParlayTab) {
        tabDecided.current = true
        setActiveTab(tab)
    }

    // One spinner for the screen. Each list used to raise its own, so switching tabs
    // could show a list-level loader and a footer loader at once.
    function activeTabLoading() {
        if (activeTab === "Building") return buildingLoading
        if (activeTab === "Closed") return closedLoading
        return openLoading
    }

    function myLays() {
        return openParlays.filter(lay => lay.owner_id === gamblerId)
    }

    function VisibleParlays() {
        if (activeTab === "Building") {
            return <ParlaysList
                key={`parlays-${activeTab}`}
                parlays={buildingParlays}
                loadMore={loadNextBuildingParlays}
                canLoadMore={canLoadMoreBuilding}
                loadingAll={buildingLoading}
                editable={true}
                loadingStates={buildingParlayLoadingStates}
            />
        } else if (activeTab === "Closed") {
            return <ParlaysList
                key={`parlays-${activeTab}`}
                parlays={closedParlays}
                loadMore={loadNextClosedParlays}
                canLoadMore={canLoadMoreClosed}
                loadingAll={closedLoading}
                editable={false}
                loadingStates={closedParlayLoadingStates}
            />
        } else if (activeTab === "Open") {
            return <ParlaysList
                key={`parlays-${activeTab}`}
                parlays={openParlays}
                loadMore={loadNextOpenParlays}
                canLoadMore={canLoadMoreOpen}
                loadingAll={openLoading}
                editable={false}
                loadingStates={openParlayLoadingStates}
            />
        } else if (activeTab === "My Lays") {
            return <ParlaysList
                key={`parlays-${activeTab}`}
                parlays={myLays()}
                loadMore={loadNextOpenParlays}
                canLoadMore={canLoadMoreOpen}
                loadingAll={openLoading}
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

    function patchPick(parlayId: number, pickId: number, change: (pick: PickResponseData) => PickResponseData) {
        // My Lays is a filtered view of the open list rather than a list of its own, so it
        // is covered by the open branch and needs no case here.
        if (buildingParlays.some(p => p.id === parlayId)) return patchBuildingPick(parlayId, pickId, change)
        if (openParlays.some(p => p.id === parlayId)) return patchOpenPick(parlayId, pickId, change)
        if (closedParlays.some(p => p.id === parlayId)) return patchClosedPick(parlayId, pickId, change)
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
            patchPick={patchPick}
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
            <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                    <ParlayTabButtons<ParlayTab>
                        tabs={["Building", "Open", "Closed", "My Lays"]}
                        setActiveTab={chooseTab}
                        activeTab={activeTab}
                        getDisplay={t => t === "My Lays" ? `${t} (${myLays().length})` : t}
                        getKey={t => t}
                        size="sm"
                        colorProps={{
                            backgroundColor: 'transparent',
                            borderColor: '#b39ddb',
                            textColor: '#b39ddb',
                            activeBackgroundColor: '#b39ddb',
                            activeBorderColor: '#b39ddb',
                            activeTextColor: '#ffffff',
                        }}
                    />
                </View>
                <View style={styles.iconButtons}>
                    <TouchableOpacity onPress={refreshAllParlays} style={styles.iconButton}>
                        <FontAwesome name="refresh" size={20} color={colors.accent} />
                    </TouchableOpacity>
                </View>
            </View>
            {/* Above the list rather than inside it, so it stays put while the closed
                lays scroll under it. Only on Closed: an open or building lay has not
                settled, so it has nothing to contribute to a running total. */}
            {activeTab === "Closed" && <SeasonMoneyHeader />}
            {VisibleParlays()}
            {activeTabLoading() && <OverlayLoader loaderProps={{ text: "Loading parlays..." }} />}
            {/* Creating a parlay is the primary action on this tab, and it was crowding the
                filters. It sits over the list instead. */}
            {activeTab === "Building" && (
                <TouchableOpacity
                    onPress={() => setIsModalVisible(true)}
                    style={styles.fab}
                    activeOpacity={0.85}
                    accessibilityLabel="Create a parlay"
                >
                    <Ionicons name="add" size={30} color={colors.textPrimary} />
                </TouchableOpacity>
            )}
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
        backgroundColor: colors.background,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingRight: spacing.md,
    },
    iconButtons: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
    },
    iconButton: {
        padding: spacing.xs,
    },
    fab: {
        position: "absolute",
        right: spacing.lg,
        // Shared with the list's bottom padding, which has to clear this.
        bottom: FAB_BOTTOM,
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        backgroundColor: colors.accent,
        alignItems: "center",
        justifyContent: "center",
        ...shadows.card,
    },
})
