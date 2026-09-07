import React, { useMemo, useState } from "react"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import {
    PropBetDirection,
    SeasonPickKind,
    SeasonPickRequestData,
    SeasonPickResponseData,
    SeasonPickStatus,
} from "@/api"
import ActivityLoader from "@/components/reusable/ActivityLoader"
import Collapsible from "@/components/reusable/Collapsible"
import Ionicons from "react-native-vector-icons/Ionicons"
import OverlayLoader from "@/components/reusable/OverlayLoader"
import { useGamblersMeFirst } from "@/composables/useGamblersMeFirst"
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import { SeasonPicksData } from "@/composables/useSeasonPicks"
import { calculatePace, paceColor } from "@/util/pace"
import { colors, shadows, spacing, typography } from "@/theme/colors"
import SeasonPickEditorModal from "./SeasonPickEditorModal"
import WeekProgressModal from "./WeekProgressModal"

type Props = {
    /** Loaded by AnalyticsView, which needs the enabled flag to decide on the tab itself. */
    season: SeasonPicksData
}

const STATUS_COLOR: Record<SeasonPickStatus, string> = {
    [SeasonPickStatus.HIT]: colors.success,
    [SeasonPickStatus.MISSED]: colors.danger,
    [SeasonPickStatus.PENDING]: colors.textSecondary,
}

/**
 * The line and market, rendered the same way as a parlay pick: a coloured caret carries
 * the direction, the line leads, and the market follows in supporting weight.
 */
function SeasonPickLine({ pick }: { pick: SeasonPickResponseData }) {
    const isOver = pick.direction === PropBetDirection.OVER
    const market = pick.kind === SeasonPickKind.TEAM_WINS ? "wins" : pick.prop_type

    return (
        <View style={styles.lineRow}>
            <Text style={[styles.caret, { color: isOver ? colors.success : colors.danger }]}>
                {isOver ? "▲" : "▼"}
            </Text>
            <Text style={styles.lineValue}>{pick.line.toFixed(1)}</Text>
            <Text style={styles.lineMarket}>{market}</Text>
        </View>
    )
}

/**
 * How far along the bet is, and whether that is fast enough.
 *
 * The percentage alone cannot say — 30% of the line is excellent in week 3 and dire in
 * week 15 — so the rate it implies is carried entirely by colour: the share of the line
 * reached, divided by the share of the season played. The scale flips for an under.
 */
function PaceLabel({ pick }: { pick: SeasonPickResponseData }) {
    const pace = calculatePace(pick.progress.total, pick.line, pick.progress.weeks_played)
    if (!pace) {
        return <Text style={styles.pickWeeks}>—</Text>
    }
    return (
        <Text style={[styles.pickWeeks, { color: paceColor(pace.index, pick.direction) }]}>
            {(pace.toGoal * 100).toFixed(0)}%
        </Text>
    )
}

type GamblerCardProps = {
    name: string
    pickCount: number
    allowance: number
    showAllowance: boolean
    children: React.ReactNode
}

/** One gambler's picks, collapsible so a five-person season stays scannable. Open by
 *  default, since seeing the picks is the point of the tab. */
function GamblerCard({ name, pickCount, allowance, showAllowance, children }: GamblerCardProps) {
    const [expanded, setExpanded] = useState(true)

    return (
        <View style={styles.card}>
            <Pressable style={styles.cardHeader} onPress={() => setExpanded(open => !open)}>
                <Text style={styles.gamblerName}>{name}</Text>
                {showAllowance && (
                    <Text style={styles.pickCount}>{pickCount}/{allowance}</Text>
                )}
                <Ionicons
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.textSecondary}
                />
            </Pressable>
            <Collapsible expanded={expanded}>
                <View style={styles.cardBody}>{children}</View>
            </Collapsible>
        </View>
    )
}

export default function SeasonPicks({ season }: Props) {
    const { gamblerId } = useGamblingSeasonContext()

    const [editing, setEditing] = useState<{ gamblerId: number, pick: SeasonPickResponseData | null } | null>(null)
    const [enteringWeek, setEnteringWeek] = useState<SeasonPickResponseData | null>(null)

    const meFirst = useGamblersMeFirst()

    const byGambler = useMemo(
        () => meFirst.map(g => ({
            gambler: g,
            picks: season.picks.filter(p => p.gambler_id === g.id),
        })),
        [meFirst, season.picks]
    )

    // A gambler runs their own picks until the admin finalizes them; the admin runs everyone's.
    const isMine = (pick: SeasonPickResponseData) => pick.gambler_id === gamblerId
    const canEditAsOwner = (pick: SeasonPickResponseData) =>
        season.editable && isMine(pick) && !pick.is_finalized
    const canEnterWeek = (pick: SeasonPickResponseData) =>
        season.editable && (season.viewerIsAdmin || isMine(pick))
    const canAddFor = (id: number, count: number) =>
        season.editable && (season.viewerIsAdmin || id === gamblerId) && count < season.pickCount

    if (!season.initialized) {
        return (
            <View style={styles.container}>
                <ActivityLoader text="Loading season picks..." />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>
                    {season.latestOpenWeek === 0
                        ? "Season has not started"
                        : `Week ${season.latestOpenWeek} open for entry`}
                </Text>
                {!season.editable && <Text style={styles.headerNote}>Season closed</Text>}
            </View>

            <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
                {byGambler.map(({ gambler, picks }) => (
                    <GamblerCard
                        key={gambler.id}
                        name={gambler.firstName}
                        pickCount={picks.length}
                        allowance={season.pickCount}
                        showAllowance={season.latestOpenWeek === 0}
                    >

                        {picks.length === 0 && (
                            <Text style={styles.fillerText}>No season picks yet.</Text>
                        )}


                        {picks.map(pick => (
                            <View key={pick.id} style={styles.pickRow}>
                                {season.pendingPickId === pick.id && <OverlayLoader loaderProps={{ size: 20 }} />}
                                <View style={styles.pickRowMain}>
                                    <View style={styles.pickMain}>
                                        <View style={styles.pickTitleRow}>
                                            <Text style={styles.pickTarget} numberOfLines={1}>{pick.target_name}</Text>
                                            {pick.is_finalized && <Text style={styles.lockedTag}>LOCKED</Text>}
                                        </View>
                                        <SeasonPickLine pick={pick} />
                                    </View>

                                    <View style={styles.pickStats}>
                                        <Text style={[styles.pickTotal, { color: STATUS_COLOR[pick.progress.status] }]}>
                                            {pick.progress.total}
                                        </Text>
                                        <PaceLabel pick={pick} />
                                    </View>

                                </View>

                                {/* Every action lives on its own row, so the pick itself reads the
                                    same whoever is looking at it and whatever they are allowed to do. */}
                                <View style={styles.actionBar}>
                                    {canEnterWeek(pick) && (
                                        <Pressable
                                            onPress={() => setEnteringWeek(pick)}
                                            style={[styles.actionChip, styles.progressChip]}
                                        >
                                            <Text style={styles.actionChipText}>
                                                {pick.progress.next_week_to_enter
                                                    ? `Progress · Wk ${pick.progress.next_week_to_enter}`
                                                    : "Progress"}
                                            </Text>
                                        </Pressable>
                                    )}
                                    {canEditAsOwner(pick) && (
                                        <Pressable
                                            onPress={() => setEditing({ gamblerId: pick.gambler_id, pick })}
                                            style={styles.actionChip}
                                        >
                                            <Text style={styles.actionChipText}>Edit</Text>
                                        </Pressable>
                                    )}
                                    {season.viewerIsAdmin && season.editable && !canEditAsOwner(pick) && (
                                        <Pressable
                                            onPress={() => setEditing({ gamblerId: pick.gambler_id, pick })}
                                            style={styles.actionChip}
                                        >
                                            <Text style={styles.actionChipText}>Admin edit</Text>
                                        </Pressable>
                                    )}
                                    {season.viewerIsAdmin && season.editable && (
                                        <Pressable
                                            onPress={() => season.setFinalized(pick.id, !pick.is_finalized)}
                                            style={[styles.actionChip, pick.is_finalized && styles.actionChipMuted]}
                                        >
                                            <Text style={styles.actionChipText}>
                                                {pick.is_finalized ? "Unlock" : "Finalize"}
                                            </Text>
                                        </Pressable>
                                    )}
                                </View>
                            </View>
                        ))}
                        {canAddFor(gambler.id, picks.length) && (
                            <View style={styles.cardFooter}>
                                <Pressable
                                    onPress={() => setEditing({ gamblerId: gambler.id, pick: null })}
                                    style={styles.addButton}
                                >
                                    <Text style={styles.addButtonText}>+ Add pick</Text>
                                </Pressable>
                            </View>
                        )}
                    </GamblerCard>
                ))}
            </ScrollView>

            {/* The modal closes as soon as the write lands, but the list is still being
                re-fetched behind it — without this the tab sits on stale rows with no
                sign that the new pick is on its way. */}
            {season.loading && season.initialized && (
                <OverlayLoader />
            )}

            <SeasonPickEditorModal
                visible={editing !== null}
                gamblerId={editing?.gamblerId ?? 0}
                gamblerName={byGambler.find(g => g.gambler.id === editing?.gamblerId)?.gambler.firstName ?? ""}
                pick={editing?.pick ?? null}
                saving={season.saving}
                onClose={() => setEditing(null)}
                onSubmit={(body: SeasonPickRequestData) => {
                    // Closed by the callback rather than here, so a failed save keeps the
                    // form up with what was typed in it.
                    const done = () => setEditing(null)
                    if (editing?.pick) season.updatePick(editing.pick.id, body, done)
                    else season.createPick(body, done)
                }}
            />

            <WeekProgressModal
                visible={enteringWeek !== null}
                pick={enteringWeek}
                latestOpenWeek={season.latestOpenWeek}
                saving={season.saving}
                onClose={() => setEnteringWeek(null)}
                onSave={body => {
                    if (enteringWeek) season.saveWeeks(enteringWeek.id, body, () => setEnteringWeek(null))
                }}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    },
    headerText: { ...typography.caption, color: colors.textSecondary, fontWeight: "600" },
    headerNote: { ...typography.caption, color: colors.textMuted, fontStyle: "italic" },
    scrollArea: { flex: 1 },
    scrollContent: { padding: spacing.lg, gap: spacing.md },
    card: {
        backgroundColor: colors.card, borderRadius: 16, padding: spacing.lg,
        borderWidth: 1, borderColor: colors.cardBorder, gap: spacing.sm, ...shadows.card,
    },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    cardBody: { gap: spacing.sm, paddingTop: spacing.sm },
    gamblerName: { ...typography.heading, color: colors.textPrimary, flex: 1 },
    pickCount: { ...typography.caption, color: colors.textMuted },
    cardFooter: { flexDirection: "row", justifyContent: "flex-end" },
    addButton: {
        paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
        borderRadius: 14, backgroundColor: colors.accentDark,
        borderWidth: 1, borderColor: colors.accent,
    },
    addButtonText: { ...typography.caption, color: colors.textPrimary, fontWeight: "600" },
    pickRow: {
        paddingVertical: spacing.sm, paddingHorizontal: spacing.sm,
        backgroundColor: colors.backgroundSecondary, borderRadius: 10,
        gap: spacing.sm,
    },
    pickRowMain: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    actionBar: {
        flexDirection: "row", justifyContent: "flex-end", flexWrap: "wrap",
        gap: spacing.xs, borderTopWidth: 1, borderTopColor: colors.cardBorder,
        paddingTop: spacing.sm,
    },
    pickMain: { flex: 1, gap: 2 },
    pickTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    pickTarget: { ...typography.body, color: colors.textPrimary, fontWeight: "600", flexShrink: 1 },
    lockedTag: { ...typography.small, color: colors.textMuted, letterSpacing: 0.5 },
    lineRow: { flexDirection: "row", alignItems: "baseline", flexWrap: "wrap" },
    caret: { ...typography.body, marginRight: spacing.xs },
    lineValue: {
        ...typography.body, color: colors.textPrimary,
        fontWeight: "700", marginRight: spacing.sm,
    },
    lineMarket: { ...typography.caption, color: colors.textSecondary },
    pickStats: { alignItems: "flex-end", minWidth: 56 },
    pickTotal: { ...typography.heading, fontWeight: "700" },
    pickWeeks: { ...typography.small, color: colors.textMuted },
    actionChip: {
        paddingVertical: 4, paddingHorizontal: spacing.sm,
        borderRadius: 12, backgroundColor: colors.card,
        borderWidth: 1, borderColor: colors.cardBorder,
    },
    actionChipMuted: { opacity: 0.7 },
    // Pushes the edit and finalize controls to the right, leaving progress on the left.
    progressChip: { marginRight: "auto" },
    actionChipText: { ...typography.small, color: colors.textSecondary, fontWeight: "600" },
    fillerText: {
        ...typography.body, color: colors.textMuted, fontStyle: "italic",
        paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
    },
})
