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

    const [gamblingSeason, setGamblingSeason] = useState<GetGamblingSeasonResponseData | null>(null)

    useEffect(() => {
        GamblingSeasonService.getGamblingSeason(seasonId).then(res => {
            setGamblingSeason(res)
        })
    }, [])

    if (!gamblingSeason) {
        return <ActivityLoader />
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