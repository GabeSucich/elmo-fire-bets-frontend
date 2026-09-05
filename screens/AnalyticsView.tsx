
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import Leaderboard from "@/components/leaderboard/Leaderboard";
import TimeSeries from "@/components/time-series/TimeSeries";
import Trends from "@/components/trends/Trends";
import ActivityLoader from "@/components/reusable/ActivityLoader";
import React from "react";
import { View } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { colors } from "@/theme/colors";
import { usePerformancesContext } from "@/contexts/performancesContext";

type Props = {
    seasonId: number
}

type AnalyticsTabsParamList = {
    Leaderboard: undefined
    "Time Series": undefined
    "Pick Trends": undefined
}

const Tab = createMaterialTopTabNavigator<AnalyticsTabsParamList>()

export default function AnalyticsView(props: Props) {
    const { performances, loading } = usePerformancesContext()

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <ActivityLoader text="Loading analytics..." />
            </View>
        )
    }

    if (!performances) {
        return <View style={{ flex: 1, backgroundColor: colors.background }} />
    }

    return (
        <Tab.Navigator
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: colors.backgroundSecondary,
                },
                tabBarActiveTintColor: colors.accent,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarIndicatorStyle: {
                    backgroundColor: colors.accent,
                },
                tabBarLabelStyle: {
                    fontWeight: '600',
                    fontSize: 13,
                },
                tabBarShowIcon: true,
            }}
        >
            <Tab.Screen
                name="Leaderboard"
                options={{
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="trophy" size={18} color={color} />,
                }}
            >
                {() => <Leaderboard performances={performances} />}
            </Tab.Screen>
            <Tab.Screen
                name="Pick Trends"
                options={{
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="trending-up" size={18} color={color} />,
                }}
            >
                {() => <Trends performances={performances} />}
            </Tab.Screen>
            <Tab.Screen
                name="Time Series"
                options={{
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="chart-line" size={18} color={color} />,
                }}
            >
                {() => <TimeSeries seasonId={props.seasonId} />}
            </Tab.Screen>
        </Tab.Navigator>
    )
}
