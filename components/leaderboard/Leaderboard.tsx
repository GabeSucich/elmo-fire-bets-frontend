import { GamblerPerformance, ScoreCorrection } from "@/api";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import AnimatedAccordion from "@/components/reusable/AnimatedAccordion";
import React, { useMemo } from "react";
import { Text, View, StyleSheet, Pressable, ScrollView } from "react-native";
import Entypo from "react-native-vector-icons/Entypo";
import Ionicons from "react-native-vector-icons/Ionicons";
import { colors, shadows, typography, spacing } from "@/theme/colors";

type Props = {
    performances: Record<string, GamblerPerformance>
}

export default function Leaderboard(props: Props) {

    const {gamblers} = useGamblingSeasonContext()

    const sortedPerformanceData = useMemo(() => {
        const unsorted = Object.entries(props.performances).map(([_id, p]) => {
            return {gambler: gamblers[p.gambler_id], performance: p}
        })
        return unsorted.sort((a, b) => b.performance.corrected_score - a.performance.corrected_score)
    }, [props.performances, gamblers])

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {sortedPerformanceData.map(({gambler, performance}, index) => (
                <View key={gambler.id} style={styles.card}>
                    <AnimatedAccordion
                        header={(toggle, open) => (
                            <>
                                <View style={styles.nameRow}>
                                    <View style={styles.rankBadge}>
                                        <Text style={styles.rankText}>{index + 1}</Text>
                                    </View>
                                    <Text style={styles.name}>{gambler.firstName}</Text>
                                    {performance.metrics.non_TD.curr_win_streak >= 3 && (
                                        <View style={styles.streakBadge}>
                                            <Text style={styles.streakText}>🔥 {performance.metrics.non_TD.curr_win_streak}</Text>
                                        </View>
                                    )}
                                    {performance.metrics.non_TD.curr_loss_streak >= 3 && (
                                        <View style={[styles.streakBadge, styles.coldStreak]}>
                                            <Text style={styles.streakText}>🧊 {performance.metrics.non_TD.curr_loss_streak}</Text>
                                        </View>
                                    )}
                                    {performance.metrics.overall.curr_bozo_streak >= 2 && (
                                        <View style={[styles.streakBadge, styles.bozoStreak]}>
                                            <Text style={styles.streakText}>🤡 {performance.metrics.overall.curr_bozo_streak}</Text>
                                        </View>
                                    )}
                                    <Text style={styles.score}>{performance.corrected_score.toFixed(1)}%</Text>
                                    <Pressable onPress={toggle} style={styles.metricsButton}>
                                        <Ionicons
                                            name={open ? "chevron-up" : "chevron-down"}
                                            size={18}
                                            color={colors.accent}
                                        />
                                    </Pressable>
                                </View>
                                <View style={styles.chipsRow}>
                                    {Object.values(performance.deductions).map((d: ScoreCorrection) => (
                                        <View key={d.identifier} style={[styles.chip, styles.deductionChip]}>
                                            <Entypo name="arrow-down" size={11} color={colors.dangerDark} />
                                            <Text style={styles.deductionText}>{d.name} ({d.associated_value}) ({`${d.adjustment}%`})</Text>
                                        </View>
                                    ))}
                                    {Object.values(performance.augmentations).map((a: ScoreCorrection) => (
                                        <View key={a.identifier} style={[styles.chip, styles.augmentationChip]}>
                                            <Entypo name="arrow-up" size={11} color={colors.successDark} />
                                            <Text style={styles.augmentationText}>{a.name} ({a.associated_value}) ({`+${a.adjustment}%`})</Text>
                                        </View>
                                    ))}
                                </View>
                            </>
                        )}
                    >
                        <View style={styles.metricsContent}>
                            <View style={styles.tilesRow}>
                                <View style={styles.tile}>
                                    <Text style={styles.tileLabel}>Non-TD</Text>
                                    <Text style={styles.tileValue}>{performance.metrics.non_TD.win_rate?.toFixed(1) ?? '—'}%</Text>
                                </View>
                                <View style={styles.tile}>
                                    <Text style={styles.tileLabel}>TD</Text>
                                    <Text style={styles.tileValue}>{performance.metrics.TD.win_rate?.toFixed(1) ?? '—'}%</Text>
                                </View>
                            </View>
                            {performance.metrics.overall.bozos > 0 && (
                                <View style={styles.metricRow}>
                                    <Text style={styles.metricLabel}>🤡 Bozos</Text>
                                    <Text style={styles.metricValueBad}>{performance.metrics.overall.bozos}</Text>
                                </View>
                            )}
                            {performance.metrics.veto_metrics.bozo_savers > 0 && (
                                <View style={styles.metricRow}>
                                    <Text style={styles.metricLabel}>🛡️ Bozo Savers</Text>
                                    <Text style={styles.metricValueGood}>{performance.metrics.veto_metrics.bozo_savers}</Text>
                                </View>
                            )}
                            {performance.metrics.sauce_factor.bitch.bozos > 0 && (
                                <View style={styles.metricRow}>
                                    <Text style={styles.metricLabel}>💩 Bitch Bozos</Text>
                                    <Text style={styles.metricValueBad}>{performance.metrics.sauce_factor.bitch.bozos}</Text>
                                </View>
                            )}
                            <View style={styles.metricRow}>
                                <Text style={styles.metricLabel}>🌶️ Spicy Win %</Text>
                                <Text style={styles.metricValue}>{performance.metrics.sauce_factor.spicy.win_rate?.toFixed(1) ?? '—'}%</Text>
                            </View>
                            <View style={styles.metricRow}>
                                <Text style={styles.metricLabel}>💩 Bitch Picks</Text>
                                <Text style={styles.metricValue}>{performance.metrics.sauce_factor.bitch.total}</Text>
                            </View>
                        </View>
                    </AnimatedAccordion>
                </View>
            ))}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.lg,
        gap: spacing.md,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        ...shadows.card,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    rankBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankText: {
        color: colors.textPrimary,
        fontWeight: '700',
        fontSize: 13,
    },
    name: {
        ...typography.heading,
        color: colors.textPrimary,
    },
    score: {
        ...typography.heading,
        color: colors.accent,
        marginLeft: 'auto',
    },
    streakBadge: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 8,
    },
    coldStreak: {
        backgroundColor: 'rgba(96, 165, 250, 0.2)',
    },
    bozoStreak: {
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
    },
    streakText: {
        ...typography.caption,
        color: colors.textPrimary,
    },
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: spacing.xs,
        marginTop: spacing.sm,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingVertical: 3,
        paddingHorizontal: spacing.sm,
        borderRadius: 6,
    },
    deductionChip: {
        backgroundColor: colors.dangerLight,
    },
    augmentationChip: {
        backgroundColor: colors.successLight,
    },
    deductionText: {
        ...typography.small,
        color: colors.dangerDark,
    },
    augmentationText: {
        ...typography.small,
        color: colors.successDark,
    },
    metricsButton: {
        padding: spacing.xs,
    },
    tilesRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    tile: {
        flex: 1,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 10,
        padding: spacing.md,
        alignItems: 'center',
    },
    tileLabel: {
        ...typography.caption,
        color: colors.textMuted,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.xs,
    },
    tileValue: {
        ...typography.title,
        color: colors.accent,
    },
    metricsContent: {
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.divider,
        marginTop: spacing.sm,
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.xs,
    },
    metricLabel: {
        ...typography.body,
        color: colors.textSecondary,
    },
    metricValue: {
        ...typography.body,
        color: colors.textPrimary,
        fontWeight: '600',
    },
    metricValueGood: {
        ...typography.body,
        color: colors.success,
        fontWeight: '600',
    },
    metricValueBad: {
        ...typography.body,
        color: colors.danger,
        fontWeight: '600',
    },
})
