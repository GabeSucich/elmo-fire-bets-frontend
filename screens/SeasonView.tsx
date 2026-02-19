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
import AnalyticsView from "./AnalyticsView";
import ActivityLoader from "@/components/reusable/ActivityLoader";
import useApiActionState from "@/composables/useApiActionState";
import { useErrorLoadingStates } from "@/composables/useErrorLoadingStates";
import ErrorView from "@/components/reusable/ErrorView";

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
        error, loading, setError, setLoading
    } = useErrorLoadingStates()

    const [gamblingSeason, setGamblingSeason] = useState<GetGamblingSeasonResponseData | null>(null)

    const {
        execute: getGamblingSeason
    } = useApiActionState(
        () => GamblingSeasonService.getGamblingSeason(seasonId),
        setGamblingSeason,
        setLoading,
        setError,
        "There was an error loading your gambling seasons."
    )

    useEffect(() => {
        getGamblingSeason()
    }, [])

    if (loading) {
        return <ActivityLoader key={"Different"} verticalAlign="center" text="Loading season data..."/>
    }

    if (error) {
        return <ErrorView errorMsg={error}/>
    }

    if (!gamblingSeason) {
        return null
    }

    return (
        <GamblingSeasonProvider gamblingSeason={gamblingSeason}>
            <Tab.Navigator>
                <Tab.Screen name="Parlays" options={{headerShown: false}}>
                    {() => <ParlaysView seasonId={seasonId}/>}
                </Tab.Screen>
                <Tab.Screen name="Analytics" options={{headerShown: false}}>
                    {() => <AnalyticsView seasonId={seasonId}/>}
                </Tab.Screen>
            </Tab.Navigator>
        </GamblingSeasonProvider>
    )
}