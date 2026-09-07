import { GamblerPerformance, ScoreCorrection, ScoredMetrics } from "@/api";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import AnimatedAccordion from "@/components/reusable/AnimatedAccordion";
import React, { useMemo, useState } from "react";
import { Text, View, StyleSheet, Pressable, ScrollView } from "react-native";
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
        const sorted = unsorted.sort((a, b) => b.performance.corrected_score - a.performance.corrected_score)

        // Standard competition ranking: everyone on the same score shares the rank of
        // the first of them, and the ranks below skip accordingly (1, T2, T2, 4).
        // Scores are compared at two decimals, which is all the backend produces —
        // a win rate rounded to 2dp plus whole-number adjustments.
        const scoreKey = (score: number) => score.toFixed(2)
        const keys = sorted.map(row => scoreKey(row.performance.corrected_score))

        // Scores normally read to one decimal. Two that differ only in the second one
        // would otherwise print identically while ranking apart, which looks like a
        // bug — so when that happens the whole board goes to two decimals and the
        // separation is visible. Genuine ties keep matching numbers and get a T.
        const shown = sorted.map(row => row.performance.corrected_score.toFixed(1))
        const collides = shown.some((value, i) => shown.some((other, j) =>
            i !== j && value === other && keys[i] !== keys[j]))
        const decimals = collides ? 2 : 1

        return sorted.map((row, index) => {
            const key = keys[index]
            return {
                ...row,
                rank: keys.indexOf(key) + 1,
                tied: keys.indexOf(key) !== keys.lastIndexOf(key),
                decimals,
            }
        })
    }, [props.performances, gamblers])

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {sortedPerformanceData.map(({gambler, performance, rank, tied, decimals}) => (
                <LeaderboardCard
                    key={gambler.id}
                    rank={rank}
                    tied={tied}
                    decimals={decimals}
                    name={gambler.firstName}
                    performance={performance}
                />
            ))}
        </ScrollView>
    )
}


type CardProps = {
    rank: number
    /** Shown as "T3" when others share the score, so the ordering within a tie reads as arbitrary. */
    tied: boolean
    /** Raised to 2 when one decimal would print two different scores identically. */
    decimals: number
    name: string
    performance: GamblerPerformance
}

function LeaderboardCard({ rank, tied, decimals, name, performance }: CardProps) {
    // Deductions and boosts read as one sentence rather than as separate chips, so a
    // gambler with two of them does not get a wall of coloured pills.
    const corrections: ScoreCorrection[] = [
        ...Object.values(performance.augmentations),
        ...Object.values(performance.deductions),
    ]
    // Held here rather than in a nested AnimatedAccordion: that component renders its
    // children twice (a hidden copy is measured to animate the height), so a nested
    // accordion would have two independent open states and the outer card would size
    // itself to the collapsed copy, clipping whatever the inner one revealed.
    const [tdOpen, setTdOpen] = useState(false)

    return (
        <View style={styles.card}>
            <AnimatedAccordion
                header={(toggle, open) => (
                    <>
                        <View style={styles.nameRow}>
                            <View style={styles.rankBadge}>
                                <Text style={styles.rankText}>{tied ? `T${rank}` : rank}</Text>
                            </View>
                            <Text style={styles.name}>{name}</Text>
                            {performance.scored_metrics.overall.curr_win_streak >= 3 && (
                                <View style={styles.streakBadge}>
                                    <Text style={styles.streakText}>🔥 {performance.scored_metrics.overall.curr_win_streak}</Text>
                                </View>
                            )}
                            {performance.scored_metrics.overall.curr_loss_streak >= 3 && (
                                <View style={[styles.streakBadge, styles.coldStreak]}>
                                    <Text style={styles.streakText}>🧊 {performance.scored_metrics.overall.curr_loss_streak}</Text>
                                </View>
                            )}
                            {performance.scored_metrics.overall.curr_bozo_streak >= 2 && (
                                <View style={[styles.streakBadge, styles.bozoStreak]}>
                                    <Text style={styles.streakText}>🤡 {performance.scored_metrics.overall.curr_bozo_streak}</Text>
                                </View>
                            )}
                            <Text style={styles.score}>{performance.corrected_score.toFixed(decimals)}%</Text>
                            <Pressable onPress={toggle} style={styles.metricsButton}>
                                <Ionicons
                                    name={open ? "chevron-up" : "chevron-down"}
                                    size={18}
                                    color={colors.accent}
                                />
                            </Pressable>
                        </View>
                        {corrections.length > 0 && (
                            <View style={styles.correctionsRow}>
                                {corrections.map((correction, index) => (
                                    <React.Fragment key={correction.identifier}>
                                        {index > 0 && <Text style={styles.correctionSeparator}>·</Text>}
                                        <Text style={styles.correctionText}>
                                            <Text style={correction.adjustment >= 0 ? styles.caretUp : styles.caretDown}>
                                                {correction.adjustment >= 0 ? "▲" : "▼"}
                                            </Text>
                                            {` ${correction.summary} `}
                                            <Text style={correction.adjustment >= 0 ? styles.caretUp : styles.caretDown}>
                                                {correction.adjustment >= 0 ? `+${correction.adjustment}` : correction.adjustment}%
                                            </Text>
                                        </Text>
                                    </React.Fragment>
                                ))}
                            </View>
                        )}
                    </>
                )}
            >
                <View style={styles.metricsContent}>
                    <SlateStats metrics={performance.scored_metrics} />

                    <View style={styles.tdSection}>
                        <Pressable onPress={() => setTdOpen(o => !o)} style={styles.tdHeader}>
                            <Text style={styles.tdHeaderText}>🏈 TD Slates</Text>
                            <Ionicons
                                name={tdOpen ? "chevron-up" : "chevron-down"}
                                size={16}
                                color={colors.textSecondary}
                            />
                        </Pressable>
                        {tdOpen && (
                            <View style={styles.tdContent}>
                                <View style={styles.metricRow}>
                                    <Text style={styles.metricLabel}>Win %</Text>
                                    <Text style={styles.metricValue}>
                                        {performance.metrics.TD_slate.overall.win_rate?.toFixed(1) ?? '—'}%
                                    </Text>
                                </View>
                                <View style={styles.metricRow}>
                                    <Text style={styles.metricLabel}>🤡 Bozos</Text>
                                    <Text style={performance.metrics.TD_slate.overall.bozos > 0 ? styles.metricValueBad : styles.metricValue}>
                                        {performance.metrics.TD_slate.overall.bozos}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </AnimatedAccordion>
        </View>
    )
}

/**
 * The stats this season's rules actually scored on, handed over by the corrector.
 * The card never picks a bucket itself, so these can never contradict the score
 * shown above them.
 */
function SlateStats({ metrics }: { metrics: ScoredMetrics }) {
    return (
        <>
            <View style={styles.tilesRow}>
                <View style={styles.tile}>
                    <Text style={styles.tileLabel}>Win %</Text>
                    <Text style={styles.tileValue}>{metrics.overall.win_rate?.toFixed(1) ?? '—'}%</Text>
                </View>
            </View>
            <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>🤡 Bozos</Text>
                <Text style={metrics.overall.bozos > 0 ? styles.metricValueBad : styles.metricValue}>
                    {metrics.overall.bozos}
                </Text>
            </View>
            {metrics.veto_metrics.bozo_savers > 0 && (
                <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>🛡️ Bozo Savers</Text>
                    <Text style={styles.metricValueGood}>{metrics.veto_metrics.bozo_savers}</Text>
                </View>
            )}
            {metrics.sauce_factor.bitch.bozos > 0 && (
                <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>💩 Bitch Bozos</Text>
                    <Text style={styles.metricValueBad}>{metrics.sauce_factor.bitch.bozos}</Text>
                </View>
            )}
            <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>🌶️ Spicy Win %</Text>
                <Text style={styles.metricValue}>{metrics.sauce_factor.spicy.win_rate?.toFixed(1) ?? '—'}%</Text>
            </View>
            <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>💩 Bitch Losses</Text>
                <Text style={metrics.sauce_factor.bitch.losses > 0 ? styles.metricValueBad : styles.metricValue}>
                    {metrics.sauce_factor.bitch.losses}
                </Text>
            </View>
        </>
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
        minWidth: 28,
        height: 28,
        paddingHorizontal: 6,
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
        paddingHorizontal: 2,
    },
    coldStreak: {},
    bozoStreak: {
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
    },
    streakText: {
        ...typography.caption,
        color: colors.textPrimary,
    },
    correctionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.md,
        marginTop: spacing.sm,
    },
    correctionText: {
        ...typography.body,
        color: colors.textSecondary,
    },
    correctionSeparator: {
        ...typography.body,
        color: colors.textMuted,
    },
    caretUp: { color: colors.success },
    caretDown: { color: colors.danger },
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
    tdSection: {
        borderTopWidth: 1,
        borderTopColor: colors.cardBorder,
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
    },
    tdContent: {
        paddingTop: spacing.sm,
    },
    tdHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: spacing.xs,
    },
    tdHeaderText: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.5,
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
