import { GamblingSeasonService } from "@/api";
import RefreshableScrollView from "@/components/reusable/RefreshableScrollView";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import ActivityLoader from "@/components/reusable/ActivityLoader";
import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, Dimensions, Pressable } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { colors, typography, spacing, shadows } from "@/theme/colors";

type Props = {
    seasonId: number
}

type GamblerLine = {
    gamblerId: number
    gamblerName: string
    vals: number[]
    color: string
}

const LINE_COLORS = ["#60a5fa", "#f87171", "#4ade80", "#fbbf24", "#c084fc"]

export default function TimeSeries(props: Props) {

    const { gamblers } = useGamblingSeasonContext()
    const [loading, setLoading] = useState(true)
    const [lines, setLines] = useState<GamblerLine[]>([])
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

    const toggleSelected = (gamblerId: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(gamblerId)) {
                next.delete(gamblerId)
            } else {
                next.add(gamblerId)
            }
            return next
        })
    }

    // Lifted out of the effect so the pull gesture can call the same fetch the mount does,
    // rather than a second copy of it that could drift.
    function reload() {
        setLoading(true)
        GamblingSeasonService.getSeasonTimeSeries(props.seasonId).then(res => {
            const gamblerLines = Object.entries(res.time_series).map(([_id, data], index) => {
                const gamblerId = data[0].gambler_id
                const vals = data.map(d => d.corrected_score)
                return {
                    gamblerId,
                    gamblerName: gamblers[gamblerId].firstName,
                    vals,
                    color: LINE_COLORS[index % LINE_COLORS.length],
                }
            })
            setLines(gamblerLines)
        })
        .finally(() => setLoading(false))
    }

    // Mount-only: the chart is rendered inside a season, so neither the id nor the gambler
    // names it reads can change while it is on screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { reload() }, [])

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityLoader text="Loading time series..." />
            </View>
        )
    }

    if (lines.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.placeholder}>No time series data available</Text>
            </View>
        )
    }

    const chartWidth = Dimensions.get("window").width - 64
    const maxDataPoints = Math.max(...lines.map(l => l.vals.length))
    const spacing_val = maxDataPoints > 1 ? chartWidth / (maxDataPoints - 1) : chartWidth

    const showAll = selectedIds.size === 0
    const visibleLines = showAll ? lines : lines.filter(l => selectedIds.has(l.gamblerId))

    const dataSet = visibleLines.map(line => ({
        data: line.vals.map(v => ({ value: v, color: line.color })),
        color: line.color,
    }))

    return (
        <RefreshableScrollView
            style={styles.container}
            onRefresh={reload}
            refreshing={loading}
        >
            <View style={styles.chartCard}>
                <LineChart
                    key={visibleLines.map(l => l.gamblerId).join(",")}
                    dataSet={dataSet}
                    height={250}
                    spacing={spacing_val}
                    initialSpacing={0}
                    endSpacing={0}
                    adjustToWidth
                    disableScroll
                    yAxisTextStyle={styles.axisText}
                    xAxisLabelTextStyle={styles.axisText}
                    formatYLabel={(val) => `${val}%`}
                    hideDataPoints
                    thickness={2}
                    curved
                    curvature={0.15}
                    maxValue={100}
                    mostNegativeValue={-5}
                    noOfSections={5}
                    yAxisColor={colors.divider}
                    xAxisColor={colors.divider}
                    rulesColor={colors.divider}
                    backgroundColor={colors.card}
                />
            </View>
            <View style={styles.legend}>
                {lines.map(line => {
                    const isActive = showAll || selectedIds.has(line.gamblerId)
                    return (
                        <Pressable
                            key={line.gamblerId}
                            style={[styles.legendItem, isActive && { borderColor: line.color }]}
                            onPress={() => toggleSelected(line.gamblerId)}
                        >
                            <View style={[styles.legendDot, { backgroundColor: line.color, opacity: isActive ? 1 : 0.3 }]} />
                            <Text style={[styles.legendText, { opacity: isActive ? 1 : 0.4 }]}>{line.gamblerName}</Text>
                        </Pressable>
                    )
                })}
            </View>
        </RefreshableScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: spacing.lg,
    },
    chartCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        overflow: 'hidden',
        ...shadows.card,
    },
    placeholder: {
        ...typography.heading,
        color: colors.textSecondary,
        textAlign: 'center',
    },
    axisText: {
        ...typography.small,
        color: colors.textSecondary,
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        marginTop: spacing.lg,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: colors.card,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        ...typography.small,
        color: colors.textPrimary,
    },
})
