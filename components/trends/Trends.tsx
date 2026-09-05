import { GamblerPerformance, SetMetrics } from "@/api";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import React, { useMemo, useState } from "react";
import { Text, View, StyleSheet, ScrollView, Pressable } from "react-native";
import { colors, typography, spacing, shadows } from "@/theme/colors";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import TrendsInfoModal from "./TrendsInfoModal";

type Props = {
    performances: Record<string, GamblerPerformance>
}

/**
 * Minimum sample before a player or prop can appear in a trend list, counted in
 * DECIDED picks — pushes and voids are excluded from win rate, so letting them
 * count toward the threshold admits entries like "100% on 1 decided pick".
 *
 * Sized against a full season: at 3 decided picks each gambler has 5-13 qualifying
 * players, and at 5 decided picks 4-6 qualifying props. TD slates carry far fewer
 * picks per player, so they use a lower bar.
 */
const MIN_TARGET_PICKS = 3
const MIN_PROP_PICKS = 5
const MIN_TD_TARGET_PICKS = 2

/**
 * "Most picked" is a count, not a rate, so pushes and voids still count as picks
 * here, and the floor is lower than the rate lists need. Without any floor the list
 * fills from week one with players picked exactly once, which reads as a trend but
 * isn't; at 3 it stays empty until roughly the halfway mark. 2 drops the one-offs
 * while still giving the section something to show by midseason.
 */
const MIN_TRUSTY_PICKS = 2

const LIST_SIZE = 3

type Summary = {
    key: string
    name: string
    total: number
    decided: number
    winRate: number
}

/** Pushes and voids are not counted in win_rate, so they don't count as sample either. */
function decidedPicks(metrics: SetMetrics) {
    return metrics.total - metrics.pushes - metrics.voids
}

function toSummary(key: string, name: string, metrics: SetMetrics): Summary | null {
    if (metrics.win_rate === null) {
        return null
    }
    return {
        key,
        name,
        total: metrics.total,
        decided: decidedPicks(metrics),
        winRate: metrics.win_rate,
    }
}

function qualifying(summaries: (Summary | null)[], minPicks: number): Summary[] {
    return summaries.filter((s): s is Summary => s !== null && s.decided >= minPicks)
}

/**
 * Best and worst are split on the 50% line rather than taken from opposite ends of
 * one sorted list. Two things fall out of that: an entry can never appear in both
 * lists (a win rate is not both above and below 50), and a "best" list can never
 * fill itself with losing records when there are fewer than six qualifying entries.
 * Entries sitting exactly at 50% are neither, so they show up in neither list.
 */
function bestOf(summaries: Summary[]) {
    return summaries
        .filter(s => s.winRate > 50)
        .sort((a, b) => b.winRate - a.winRate || b.decided - a.decided)
        .slice(0, LIST_SIZE)
}

function worstOf(summaries: Summary[]) {
    return summaries
        .filter(s => s.winRate < 50)
        .sort((a, b) => a.winRate - b.winRate || b.decided - a.decided)
        .slice(0, LIST_SIZE)
}

function mostPicked(summaries: (Summary | null)[], minPicks: number) {
    return summaries
        .filter((s): s is Summary => s !== null && s.total >= minPicks)
        .sort((a, b) => b.total - a.total || b.winRate - a.winRate)
        .slice(0, LIST_SIZE)
}

type GamblerTrends = {
    gamblerId: number
    gamblerName: string
    sharpCalls: Summary[]
    olTrusties: Summary[]
    banList: Summary[]
}

type GamblerPropTrends = {
    gamblerId: number
    gamblerName: string
    sharpCalls: Summary[]
    loveThePain: Summary[]
}

type GamblerTDTrends = {
    gamblerId: number
    gamblerName: string
    record: SetMetrics
    goToGuys: Summary[]
}

/** Player trends exclude TD slates: they get their own section. */
function buildGamblerTrends(
    gamblerId: number,
    gamblerName: string,
    performance: GamblerPerformance
): GamblerTrends {
    const { prop_targets, target_names } = performance.metrics.non_TD_slate

    const summaries = Object.entries(prop_targets).map(([targetId, metrics]) =>
        toSummary(targetId, target_names[targetId] ?? `Target ${targetId}`, metrics))

    const withRate = qualifying(summaries, MIN_TARGET_PICKS)

    return {
        gamblerId,
        gamblerName,
        sharpCalls: bestOf(withRate),
        olTrusties: mostPicked(summaries, MIN_TRUSTY_PICKS),
        banList: worstOf(withRate),
    }
}

function buildGamblerPropTrends(
    gamblerId: number,
    gamblerName: string,
    performance: GamblerPerformance
): GamblerPropTrends {
    const { bet_types } = performance.metrics.non_TD_slate

    const summaries = Object.entries(bet_types).map(([propType, metrics]) =>
        toSummary(propType, propType, metrics))

    const withRate = qualifying(summaries, MIN_PROP_PICKS)

    return {
        gamblerId,
        gamblerName,
        sharpCalls: bestOf(withRate),
        loveThePain: worstOf(withRate),
    }
}

/**
 * TD slates are their own game: every pick is an anytime-TD prop and the same
 * players recur, so mixing them into the general lists both distorts those lists
 * and buries how someone actually does on TD nights.
 *
 * Only the record and the most-picked players are shown. Per-target win rates on
 * TD slates run on 2-4 picks a season, which is noise, not a trend.
 */
function buildGamblerTDTrends(
    gamblerId: number,
    gamblerName: string,
    performance: GamblerPerformance
): GamblerTDTrends {
    const { prop_targets, target_names, overall } = performance.metrics.TD_slate

    const summaries = Object.entries(prop_targets).map(([targetId, metrics]) =>
        toSummary(targetId, target_names[targetId] ?? `Target ${targetId}`, metrics))

    return {
        gamblerId,
        gamblerName,
        record: overall,
        goToGuys: mostPicked(summaries, MIN_TD_TARGET_PICKS),
    }
}

type Mode = "player" | "prop" | "td"

const MODES: { key: Mode, label: string }[] = [
    { key: "player", label: "Players" },
    { key: "prop", label: "Props" },
    { key: "td", label: "TDs" },
]

type Gambler = { id: number, firstName: string }

/** Builds one entry per gambler that has a performance, in the given order. */
function buildAll<T>(
    gamblers: Gambler[],
    performanceFor: (id: number) => GamblerPerformance | undefined,
    build: (id: number, name: string, perf: GamblerPerformance) => T
): T[] {
    return gamblers.flatMap(g => {
        const perf = performanceFor(g.id)
        return perf ? [build(g.id, g.firstName, perf)] : []
    })
}

export default function Trends(props: Props) {
    const [mode, setMode] = useState<Mode>("player")
    const [infoVisible, setInfoVisible] = useState(false)
    const { gamblerId, sortedGamblers } = useGamblingSeasonContext()

    // The signed-in gambler reads their own card first.
    const meFirst = useMemo(
        () => [...sortedGamblers].sort((a, b) => {
            if (a.id === gamblerId) return -1
            if (b.id === gamblerId) return 1
            return 0
        }),
        [sortedGamblers, gamblerId]
    )

    const performanceFor = useMemo(() => {
        const byGambler = new Map(Object.values(props.performances).map(p => [p.gambler_id, p]))
        return (id: number) => byGambler.get(id)
    }, [props.performances])

    const gamblerTrends = useMemo(
        () => buildAll(meFirst, performanceFor, buildGamblerTrends), [meFirst, performanceFor])
    const propTrends = useMemo(
        () => buildAll(meFirst, performanceFor, buildGamblerPropTrends), [meFirst, performanceFor])
    const tdTrends = useMemo(
        () => buildAll(meFirst, performanceFor, buildGamblerTDTrends), [meFirst, performanceFor])

    return (
        <View style={styles.container}>
            <View style={styles.toggleRow}>
                {MODES.map(m => (
                    <Pressable
                        key={m.key}
                        style={[styles.toggleButton, mode === m.key && styles.toggleActive]}
                        onPress={() => setMode(m.key)}
                    >
                        <Text style={[styles.toggleText, mode === m.key && styles.toggleTextActive]}>{m.label}</Text>
                    </Pressable>
                ))}
            </View>

            <Pressable
                style={styles.infoRow}
                onPress={() => setInfoVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="How are trends calculated"
                hitSlop={spacing.sm}
            >
                <Text style={styles.infoLabel}>How are trends calculated?</Text>
                <MaterialCommunityIcons name="information-outline" size={16} color={colors.textSecondary} />
            </Pressable>

            <TrendsInfoModal
                visible={infoVisible}
                onClose={() => setInfoVisible(false)}
                minTargetPicks={MIN_TARGET_PICKS}
                minTrustyPicks={MIN_TRUSTY_PICKS}
                minPropPicks={MIN_PROP_PICKS}
                minTDTargetPicks={MIN_TD_TARGET_PICKS}
            />

            <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
                {mode === "player" && (
                    <>
                        {gamblerTrends.map(trend => (
                            <View key={trend.gamblerId} style={styles.card}>
                                <Text style={styles.gamblerName}>{trend.gamblerName}</Text>

                                <TrendSection
                                    title="Sharp Calls" emoji={"🎯"} items={trend.sharpCalls} showRate showTotal
                                    emptyText={`No player is above 50% on ${MIN_TARGET_PICKS}+ settled picks yet.`}
                                />
                                <TrendSection
                                    title="Ol' Trusties" emoji={"🤝"} items={trend.olTrusties} showTotal
                                    emptyText={`Nobody has been picked ${MIN_TRUSTY_PICKS}+ times yet.`}
                                />
                                <TrendSection
                                    title="Ban List" emoji={"🚫"} items={trend.banList} showRate showTotal
                                    emptyText={`No player is below 50% on ${MIN_TARGET_PICKS}+ settled picks yet.`}
                                />
                            </View>
                        ))}
                    </>
                )}

                {mode === "prop" && (
                    <>
                        {propTrends.map(trend => (
                            <View key={trend.gamblerId} style={styles.card}>
                                <Text style={styles.gamblerName}>{trend.gamblerName}</Text>

                                <TrendSection
                                    title="Can't Miss" emoji={"🎯"} items={trend.sharpCalls} showRate showTotal
                                    emptyText={`No prop type is above 50% on ${MIN_PROP_PICKS}+ settled picks yet.`}
                                />
                                <TrendSection
                                    title="Love the Pain" emoji={"😈"} items={trend.loveThePain} showRate showTotal
                                    emptyText={`No prop type is below 50% on ${MIN_PROP_PICKS}+ settled picks yet.`}
                                />
                            </View>
                        ))}
                    </>
                )}

                {mode === "td" && (
                    <>
                        {tdTrends.map(trend => (
                            <View key={trend.gamblerId} style={styles.card}>
                                <View style={styles.tdHeader}>
                                    <Text style={styles.gamblerName}>{trend.gamblerName}</Text>
                                    <TDRecord record={trend.record} />
                                </View>

                                <TrendSection
                                    title="Go-To Guys" emoji={"🎪"} items={trend.goToGuys} showRate showTotal
                                    emptyText={`Nobody has been picked ${MIN_TD_TARGET_PICKS}+ times on a TD slate yet.`}
                                />
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>
        </View>
    )
}

function TDRecord({ record }: { record: SetMetrics }) {
    if (record.win_rate === null) {
        return <Text style={styles.tdRecordEmpty}>No TD slates yet</Text>
    }
    return (
        <View style={styles.tdRecordRow}>
            <Text style={styles.tdRecord}>{record.wins}-{record.losses}</Text>
            <Text style={[styles.tdRate, record.win_rate >= 50 ? styles.statGood : styles.statBad]}>
                {record.win_rate.toFixed(1)}%
            </Text>
        </View>
    )
}

type TrendSectionProps = {
    title: string
    emoji: string
    items: Summary[]
    /** Says what this section is still waiting for, rather than just that it's waiting. */
    emptyText: string
    showRate?: boolean
    showTotal?: boolean
}

function TrendSection({ title, emoji, items, emptyText, showRate, showTotal }: TrendSectionProps) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{emoji} {title}</Text>
            {items.length === 0 && (
                <Text style={styles.fillerText}>{emptyText}</Text>
            )}
            {items.map((item, i) => (
                <View key={item.key} style={styles.targetRow}>
                    <Text style={styles.targetRank}>{i + 1}.</Text>
                    <Text style={styles.targetName} numberOfLines={1}>{item.name}</Text>
                    {showRate && (
                        <Text style={[styles.targetStat, item.winRate >= 50 ? styles.statGood : styles.statBad]}>
                            {item.winRate.toFixed(1)}%
                        </Text>
                    )}
                    {showTotal && (
                        <Text style={styles.targetStat}>{item.total} picks</Text>
                    )}
                </View>
            ))}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    toggleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: spacing.sm,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-end",
        gap: spacing.xs,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
    },
    infoLabel: {
        ...typography.caption,
        color: colors.textSecondary,
    },
    toggleButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.lg,
        borderRadius: 20,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    toggleActive: {
        backgroundColor: colors.accentDark,
        borderColor: colors.accent,
    },
    toggleText: {
        ...typography.body,
        color: colors.textSecondary,
        fontWeight: "600",
    },
    toggleTextActive: {
        color: colors.textPrimary,
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.lg,
        gap: spacing.md,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        gap: spacing.md,
        ...shadows.card,
    },
    gamblerName: {
        ...typography.heading,
        color: colors.textPrimary,
    },
    tdHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.sm,
    },
    tdRecordRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    tdRecord: {
        ...typography.body,
        color: colors.textSecondary,
        fontWeight: "600",
    },
    tdRate: {
        ...typography.heading,
        fontWeight: "700",
    },
    tdRecordEmpty: {
        ...typography.body,
        color: colors.textMuted,
        fontStyle: "italic",
    },
    section: {
        gap: spacing.xs,
    },
    sectionTitle: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    targetRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
        backgroundColor: colors.backgroundSecondary,
        borderRadius: 8,
    },
    targetRank: {
        ...typography.body,
        color: colors.textMuted,
        width: 20,
    },
    targetName: {
        ...typography.body,
        color: colors.textPrimary,
        flex: 1,
    },
    targetStat: {
        ...typography.body,
        color: colors.textSecondary,
        fontWeight: "600",
    },
    statGood: {
        color: colors.success,
    },
    statBad: {
        color: colors.danger,
    },
    fillerText: {
        ...typography.body,
        color: colors.textMuted,
        fontStyle: "italic",
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.sm,
    },
})
