import { GamblingSeasonService, GetGamblingSeasonResponseData } from "@/api";
import { BottomTabNavigationProp, createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "@react-navigation/elements";
import { RouteProp, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { MainStackParamList } from "@/Main";
import ParlaysView from "./ParlaysView";
import { ActivityIndicator, View } from "react-native";
import { GamblingSeasonProvider } from "@/contexts/gamblingSeasonContext";
import { PerformancesProvider } from "@/contexts/performancesContext";
import AnalyticsView from "./AnalyticsView";
import ActivityLoader from "@/components/reusable/ActivityLoader";
import useApiActionState from "@/composables/useApiActionState";
import { useLoadingState } from "@/composables/useLoadingState";
import { colors } from "@/theme/colors";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

type NavigationProp = NativeStackNavigationProp<MainStackParamList, "Season">
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

    useEffect(() => {
        getGamblingSeason()
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
