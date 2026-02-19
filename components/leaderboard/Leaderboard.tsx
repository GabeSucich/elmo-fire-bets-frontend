import { GamblerPerformance, GamblingSeasonService, ScoreCorrection } from "@/api";
import { Gambler, useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import { setApiErrorMsg } from "@/util/error";
import ActivityLoader from "@/components/reusable/ActivityLoader";
import AnimatedAccordion from "@/components/reusable/AnimatedAccordion";
import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";
import Entypo from "react-native-vector-icons/Entypo";
import Ionicons from "react-native-vector-icons/Ionicons";

type Props = {
    seasonId: number
}

export default function Leaderboard(props: Props) {

    const {gamblers} = useGamblingSeasonContext()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [sortedPerfomanceData, setSortedPerformanceData] = useState<{gambler: Gambler, performance: GamblerPerformance}[]>([])

    useEffect(() => {
        setLoading(true)
        GamblingSeasonService.getSeasonGamblerPerformances(props.seasonId).then(res => {
            const unsorted = Object.entries(res.performances).map(([id, p]) => {
                return {gambler: gamblers[p.gambler_id], performance: p}
            })
            setSortedPerformanceData(unsorted.sort((a, b) => b.performance.corrected_score - a.performance.corrected_score))
        })
        .catch(e => setApiErrorMsg(e, setError, "There was an error loading performance data"))
        .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return <ActivityLoader text="Loading leaderboard..." />
    }

    return (
        <View style={styles.container}>
            {sortedPerfomanceData.map(({gambler, performance}, index) => (
                <View key={gambler.id} style={styles.row}>
                    <AnimatedAccordion
                        header={(toggle, open) => (
                            <>
                                <View style={styles.nameRow}>
                                    <Text style={styles.rank}>{index + 1}.</Text>
                                    <Text style={styles.name}>{gambler.firstName}</Text>
                                    <Text style={styles.score}>{performance.corrected_score.toFixed(1)}%</Text>
                                    {performance.metrics.non_TD.curr_win_streak >= 3 && (
                                        <Text style={styles.streakBadge}>🔥 {performance.metrics.non_TD.curr_win_streak}</Text>
                                    )}
                                    {performance.metrics.non_TD.curr_loss_streak >= 3 && (
                                        <Text style={styles.streakBadge}>🧊 {performance.metrics.non_TD.curr_loss_streak}</Text>
                                    )}
                                    {performance.metrics.overall.curr_bozo_streak >= 2 && (
                                        <Text style={styles.streakBadge}>🤡 {performance.metrics.overall.curr_bozo_streak}</Text>
                                    )}
                                    <Pressable onPress={toggle} style={styles.metricsButton}>
                                        <Ionicons
                                            name={open ? "arrow-down-circle-outline" : "arrow-forward-circle-outline"}
                                            size={16}
                                            color="#007AFF"
                                        />
                                        <Text style={styles.metricsButtonText}>Metrics</Text>
                                    </Pressable>
                                </View>
                                <View style={styles.chipsRow}>
                                    {Object.values(performance.deductions).map((d: ScoreCorrection) => (
                                        <View key={d.identifier} style={[styles.chip, styles.deductionChip]}>
                                            <Entypo name="arrow-down" size={12} color="#dc2626" />
                                            <Text style={styles.deductionText}>{d.name} ({d.associated_value}) ({`${d.adjustment}%`})</Text>
                                        </View>
                                    ))}
                                    {Object.values(performance.augmentations).map((a: ScoreCorrection) => (
                                        <View key={a.identifier} style={[styles.chip, styles.augmentationChip]}>
                                            <Entypo name="arrow-up" size={12} color="#16a34a" />
                                            <Text style={styles.augmentationText}>{a.name} ({a.associated_value}) ({`+${a.adjustment}%`})</Text>
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}
                    >
                        <Text style={{ padding: 8, color: '#666' }}>Metrics coming soon</Text>
                    </AnimatedAccordion>
                </View>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        padding: 16,
    },
    row: {
        marginBottom: 12,
        alignItems: 'center',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    rank: {
        fontSize: 16,
        fontWeight: '600',
    },
    name: {
        fontSize: 16,
    },
    score: {
        fontSize: 16,
        fontWeight: '700',
    },
    streakBadge: {
        fontSize: 14,
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 4,
        marginTop: 4,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 8,
    },
    deductionChip: {
        backgroundColor: '#fee2e2',
    },
    augmentationChip: {
        backgroundColor: '#dcfce7',
    },
    deductionText: {
        fontSize: 11,
        color: '#dc2626',
    },
    augmentationText: {
        fontSize: 11,
        color: '#16a34a',
    },
    metricsButton: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 3,
        marginLeft: 4,
    },
    metricsButtonText: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '500' as const,
    },
})