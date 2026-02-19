import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import Leaderboard from "@/components/leaderboard/Leaderboard";
import TimeSeries from "@/components/time-series/TimeSeries";
import React from "react";

type Props = {
    seasonId: number
}

type AnalyticsTabsParamList = {
    Leaderboard: undefined
    "Time Series": undefined
}

const Tab = createMaterialTopTabNavigator<AnalyticsTabsParamList>()

export default function AnalyticsView(props: Props) {
    return (
        <Tab.Navigator>
            <Tab.Screen name="Leaderboard">
                {() => <Leaderboard seasonId={props.seasonId} />}
            </Tab.Screen>
            <Tab.Screen name="Time Series">
                {() => <TimeSeries seasonId={props.seasonId} />}
            </Tab.Screen>
        </Tab.Navigator>
    )
}