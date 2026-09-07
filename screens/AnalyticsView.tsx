
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import Leaderboard from "@/components/leaderboard/Leaderboard";
import TimeSeries from "@/components/time-series/TimeSeries";
import Trends from "@/components/trends/Trends";
import SeasonPicks from "@/components/season-picks/SeasonPicks";
import { useSeasonPicks } from "@/composables/useSeasonPicks";
import ActivityLoader from "@/components/reusable/ActivityLoader";
import React from "react";
import { View } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { colors, spacing } from "@/theme/colors";
import { usePerformancesContext } from "@/contexts/performancesContext";

type Props = {
    seasonId: number
}

type AnalyticsTabsParamList = {
    Leaderboard: undefined
    "Time Series": undefined
    "Pick Trends": undefined
    "Season Picks": undefined
}

const Tab = createMaterialTopTabNavigator<AnalyticsTabsParamList>()

export default function AnalyticsView(props: Props) {
    const { performances, loading } = usePerformancesContext()
    // Loaded here rather than inside the tab: whether the tab exists at all depends on
    // the season's rules, which only come back with this call.
    const seasonPicks = useSeasonPicks(props.seasonId)

    // Only the first load blocks: gating on every refresh would remount the tab
    // navigator after each write and bounce the user back to the first tab.
    if (loading || !seasonPicks.initialized) {
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
                // Four tabs no longer fit across a phone. Scrolling needs an explicit
                // auto width, or each item is sized to an equal share of the screen and
                // the labels truncate instead of the bar scrolling.
                tabBarScrollEnabled: true,
                tabBarItemStyle: {
                    width: "auto",
                    paddingHorizontal: spacing.md,
                },
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
            {seasonPicks.enabled && (
                <Tab.Screen
                    name="Season Picks"
                    options={{
                        tabBarIcon: ({ color }) => <MaterialCommunityIcons name="calendar-star" size={18} color={color} />,
                    }}
                >
                    {() => <SeasonPicks season={seasonPicks} />}
                </Tab.Screen>
            )}
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
