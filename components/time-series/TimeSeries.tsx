import { GamblingSeasonService } from "@/api";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import ActivityLoader from "@/components/reusable/ActivityLoader";
import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, Dimensions, Pressable } from "react-native";
import { LineChart } from "react-native-gifted-charts";

type Props = {
    seasonId: number
}

type GamblerLine = {
    gamblerId: number
    gamblerName: string
    vals: number[]
    color: string
}

const LINE_COLORS = ["#007AFF", "#FF3B30", "#34C759", "#FF9500", "#AF52DE"]

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

    useEffect(() => {
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
    }, [])

    if (loading) {
        return <ActivityLoader text="Loading time series..." />
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
    const spacing = maxDataPoints > 1 ? chartWidth / (maxDataPoints - 1) : chartWidth

    const showAll = selectedIds.size === 0
    const visibleLines = showAll ? lines : lines.filter(l => selectedIds.has(l.gamblerId))

    const dataSet = visibleLines.map(line => ({
        data: line.vals.map(v => ({ value: v, color: line.color })),
        color: line.color,
    }))

    return (
        <View style={styles.container}>
            <LineChart
                key={visibleLines.map(l => l.gamblerId).join(",")}
                dataSet={dataSet}
                height={250}
                spacing={spacing}
                initialSpacing={0}
                endSpacing={0}
                adjustToWidth
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
            />
            <View style={styles.legend}>
                {lines.map(line => {
                    const isActive = showAll || selectedIds.has(line.gamblerId)
                    return (
                        <Pressable key={line.gamblerId} style={styles.legendItem} onPress={() => toggleSelected(line.gamblerId)}>
                            <View style={[styles.legendDot, { backgroundColor: line.color, opacity: isActive ? 1 : 0.3 }]} />
                            <Text style={[styles.legendText, { opacity: isActive ? 1 : 0.3 }]}>{line.gamblerName}</Text>
                        </Pressable>
                    )
                })}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    placeholder: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    axisText: {
        fontSize: 10,
        color: '#666',
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
        marginTop: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        fontSize: 13,
        color: '#333',
    },
})