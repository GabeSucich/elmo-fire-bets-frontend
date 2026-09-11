import { GamblerPerformance, SetMetrics } from "@/api";
import RefreshableScrollView from "@/components/reusable/RefreshableScrollView";
import { usePerformancesContext } from "@/contexts/performancesContext";
import { useGamblersMeFirst } from "@/composables/useGamblersMeFirst";
import React, { useMemo, useState } from "react";
import { Text, View, StyleSheet, Pressable } from "react-native";
import { colors, typography, spacing, shadows } from "@/theme/colors";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import TrendsInfoModal from "./TrendsInfoModal";
import {
    bestOf,
    buildBanList,
    buildOlTrusties,
    LIST_SIZE,
    MIN_TARGET_PICKS,
    qualifying,
    Summary,
    toSummary,
    worstOf,
} from "@/util/trends";

type Props = {
    performances: Record<string, GamblerPerformance>
}

const MIN_PROP_PICKS = 5
/** TD slate lists rank by how many picks actually landed or missed, not by rate. */
const MIN_TD_WINS = 2
const MIN_TD_LOSSES = 2

/** Shared across every section — the info modal carries the per-section thresholds. */
const EMPTY_TEXT = "Not enough data"

function mostWins(summaries: (Summary | null)[], minWins: number) {
    return summaries
        .filter((s): s is Summary => s !== null && s.wins >= minWins)
        .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
        .slice(0, LIST_SIZE)
}

function mostLosses(summaries: (Summary | null)[], minLosses: number) {
    return summaries
        .filter((s): s is Summary => s !== null && s.losses >= minLosses)
        .sort((a, b) => b.losses - a.losses || a.wins - b.wins)
        .slice(0, LIST_SIZE)
}

type GamblerTrends = {
    gamblerId: number
    gamblerName: string
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
    cashedIn: Summary[]
    burnedBy: Summary[]
}

/** Player trends exclude TD slates: they get their own section. */
function buildGamblerTrends(
    gamblerId: number,
    gamblerName: string,
    performance: GamblerPerformance
): GamblerTrends {
    return {
        gamblerId,
        gamblerName,
        olTrusties: buildOlTrusties(performance),
        banList: buildBanList(performance),
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
 * Per-target win rates are noise here — a season gives each player 2-4 TD picks — so
 * the lists rank by how many picks actually hit or missed rather than by rate.
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
        cashedIn: mostWins(summaries, MIN_TD_WINS),
        burnedBy: mostLosses(summaries, MIN_TD_LOSSES),
    }
}

type Mode = "player" | "prop" | "td"

const MODES: { key: Mode, label: string }[] = [
    { key: "prop", label: "Props" },
    { key: "player", label: "Players" },
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
    const { loading, reload } = usePerformancesContext()
    const [mode, setMode] = useState<Mode>("prop")
    const [infoVisible, setInfoVisible] = useState(false)
    const meFirst = useGamblersMeFirst()

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
            <View style={styles.header}>
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
                    onPress={() => setInfoVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="How are trends calculated"
                    hitSlop={spacing.md}
                >
                    <MaterialCommunityIcons name="information-outline" size={22} color={colors.textSecondary} />
                </Pressable>
            </View>

            <TrendsInfoModal
                visible={infoVisible}
                onClose={() => setInfoVisible(false)}
                minTargetPicks={MIN_TARGET_PICKS}
                minPropPicks={MIN_PROP_PICKS}
                minTDWins={MIN_TD_WINS}
                minTDLosses={MIN_TD_LOSSES}
            />

            <RefreshableScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                onRefresh={reload}
                refreshing={loading}
            >
                {mode === "player" && (
                    <>
                        {gamblerTrends.map(trend => (
                            <View key={trend.gamblerId} style={styles.card}>
                                <Text style={styles.gamblerName}>{trend.gamblerName}</Text>

                                <TrendSection title="Ol' Trusties" emoji={"🤝"} items={trend.olTrusties} showRate showTotal />
                                <TrendSection title="Ban List" emoji={"🚫"} items={trend.banList} showRate showTotal />
                            </View>
                        ))}
                    </>
                )}

                {mode === "prop" && (
                    <>
                        {propTrends.map(trend => (
                            <View key={trend.gamblerId} style={styles.card}>
                                <Text style={styles.gamblerName}>{trend.gamblerName}</Text>

                                <TrendSection title="Can't Miss" emoji={"🎯"} items={trend.sharpCalls} showRate showTotal />
                                <TrendSection title="Love the Pain" emoji={"😈"} items={trend.loveThePain} showRate showTotal />
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

                                <TrendSection title="Cashed In" emoji={"🤑"} items={trend.cashedIn} showCount="wins" />
                                <TrendSection title="Burned By" emoji={"💀"} items={trend.burnedBy} showCount="losses" />
                            </View>
                        ))}
                    </>
                )}
            </RefreshableScrollView>
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
    showRate?: boolean
    showTotal?: boolean
    /** Renders the raw win or loss count that the list is ranked on. */
    showCount?: "wins" | "losses"
}

function TrendSection({ title, emoji, items, showRate, showTotal, showCount }: TrendSectionProps) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{emoji} {title}</Text>
            {items.length === 0 && (
                <Text style={styles.fillerText}>{EMPTY_TEXT}</Text>
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
                    {showCount && (
                        <Text style={styles.targetStat}>
                            {showCount === "wins" ? item.wins : item.losses} {showCount}
                        </Text>
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.sm,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    toggleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
        flexShrink: 1,
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
