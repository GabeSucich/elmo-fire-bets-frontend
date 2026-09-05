import { GamblerPerformance, GamblingSeasonService } from "@/api";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import Leaderboard from "@/components/leaderboard/Leaderboard";
import TimeSeries from "@/components/time-series/TimeSeries";
import Trends from "@/components/trends/Trends";
import ActivityLoader from "@/components/reusable/ActivityLoader";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { colors } from "@/theme/colors";
import { useToastContext } from "@/contexts/toastContext";
import { setApiErrorMsg } from "@/util/error";

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
    const { showToast } = useToastContext()
    const [loading, setLoading] = useState(true)
    const [performances, setPerformances] = useState<Record<string, GamblerPerformance> | null>(null)

    function loadPerformances() {
        setLoading(true)
        GamblingSeasonService.getSeasonGamblerPerformances(props.seasonId)
            .then(res => setPerformances(res.performances))
            .catch(e => setApiErrorMsg(
                e,
                message => showToast(message, {
                    sticky: true,
                    action: { label: "Retry", onPress: loadPerformances }
                }),
                "There was an error loading performance data"
            ))
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        loadPerformances()
    }, [])

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
