import { GamblingSeasonService, GetGamblingSeasonResponseData } from "@/api";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { RouteProp, useRoute } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { MainStackParamList } from "@/Main";
import ParlaysView from "./ParlaysView";
import { View } from "react-native";
import { GamblingSeasonProvider } from "@/contexts/gamblingSeasonContext";
import { PerformancesProvider } from "@/contexts/performancesContext";
import AnalyticsView from "./AnalyticsView";
import ActivityLoader from "@/components/reusable/ActivityLoader";
import useApiActionState from "@/composables/useApiActionState";
import { useLoadingState } from "@/composables/useLoadingState";
import { colors } from "@/theme/colors";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

type SeasonViewRouteProps = RouteProp<MainStackParamList, "Season">

type SeasonTabsParamList = {
    Parlays: undefined,
    Analytics: undefined
}
const Tab = createBottomTabNavigator<SeasonTabsParamList>()

export default function SeasonView() {
    const route = useRoute<SeasonViewRouteProps>()
    const seasonId = route.params.season.seasonId

    const {
        loading, setLoading
    } = useLoadingState()

    const [gamblingSeason, setGamblingSeason] = useState<GetGamblingSeasonResponseData | null>(null)

    const {
        execute: getGamblingSeason
    } = useApiActionState(
        () => GamblingSeasonService.getGamblingSeason(seasonId),
        setGamblingSeason,
        setLoading,
        "There was an error loading your gambling seasons.",
        { retryable: true }
    )

    // Mount-only: the screen is pushed per season, so the id it closes over cannot change
    // underneath it, and `execute` is a fresh closure every render.
    useEffect(() => {
        getGamblingSeason()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <ActivityLoader key={"Different"} verticalAlign="center" text="Loading season data..."/>
            </View>
        )
    }

    if (!gamblingSeason) {
        return <View style={{ flex: 1, backgroundColor: colors.background }} />
    }

    return (
        <GamblingSeasonProvider gamblingSeason={gamblingSeason}>
            <PerformancesProvider seasonId={seasonId}>
            <Tab.Navigator
                // Back returns to the tab you came from rather than jumping to Parlays.
                // Only reaches the system back gesture and the Android hardware button —
                // the header chevron belongs to the stack above and always leaves the season.
                backBehavior="history"
                screenOptions={{
                    tabBarStyle: {
                        backgroundColor: colors.backgroundSecondary,
                        borderTopColor: colors.cardBorder,
                    },
                    tabBarActiveTintColor: colors.accent,
                    tabBarInactiveTintColor: colors.textSecondary,
                }}
            >
                <Tab.Screen name="Parlays" options={{
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="poker-chip" size={size} color={color} />
                    ),
                }}>
                    {() => <ParlaysView seasonId={seasonId}/>}
                </Tab.Screen>
                <Tab.Screen name="Analytics" options={{
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="chart-bar" size={size} color={color} />
                    ),
                }}>
                    {() => <AnalyticsView seasonId={seasonId}/>}
                </Tab.Screen>
            </Tab.Navigator>
            </PerformancesProvider>
        </GamblingSeasonProvider>
    )
}
