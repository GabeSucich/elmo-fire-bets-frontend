import React, { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import {
    PropBetDirection,
    SeasonPickKind,
    SeasonPickRequestData,
    SeasonPickResponseData,
    SeasonPickStatus,
} from "@/api"
import ActivityLoader from "@/components/reusable/ActivityLoader"
import Collapsible from "@/components/reusable/Collapsible"
import RefreshableScrollView from "@/components/reusable/RefreshableScrollView"
import Ionicons from "react-native-vector-icons/Ionicons"
import OverlayLoader from "@/components/reusable/OverlayLoader"
import { useGamblersMeFirst } from "@/composables/useGamblersMeFirst"
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import { SeasonPicksData } from "@/composables/useSeasonPicks"
import { calculatePace, calculateRequirement, Pace, paceColor, PickShape } from "@/util/pace"
import { countLabel, formatLine, formatRate, formatStat } from "@/util/statFormat"
import { colors, shadows, spacing, typography } from "@/theme/colors"
import SeasonPickEditorModal from "./SeasonPickEditorModal"
import WeekProgressModal from "./WeekProgressModal"
import TeamLogo from "@/components/reusable/TeamLogo"

type Props = {
    /** Loaded by AnalyticsView, which needs the enabled flag to decide on the tab itself. */
    season: SeasonPicksData
}

const STATUS_COLOR: Record<SeasonPickStatus, string> = {
    [SeasonPickStatus.HIT]: colors.success,
    [SeasonPickStatus.MISSED]: colors.danger,
    [SeasonPickStatus.PENDING]: colors.textSecondary,
}

/** "Wins" for a team total, otherwise the prop's own market name. */
function statLabel(pick: SeasonPickResponseData): string {
    return pick.kind === SeasonPickKind.TEAM_WINS ? "Wins" : (pick.prop_type ?? "")
}

/** The pick as the pace maths wants it, so both figures are handed the same inputs. */
function shapeOf(pick: SeasonPickResponseData): PickShape {
    return {
        total: pick.progress.total,
        line: pick.line,
        gamesElapsed: pick.progress.games_elapsed,
        direction: pick.direction,
        kind: pick.kind,
        propType: pick.prop_type ?? null,
    }
}

/** Where the spectrum puts this pick, falling back to its status before any game. */
function statColor(pick: SeasonPickResponseData, pace: Pace | null): string {
    return pace ? paceColor(pace.index, pick.direction) : STATUS_COLOR[pick.progress.status]
}

/**
 * The line and market, rendered the same way as a parlay pick: a coloured caret carries
 * the direction, the line leads, and the market follows in supporting weight.
 */
function SeasonPickLine({ pick }: { pick: SeasonPickResponseData }) {
    const isOver = pick.direction === PropBetDirection.OVER

    return (
        <View style={styles.lineRow}>
            <Text style={[styles.caret, { color: isOver ? colors.success : colors.danger }]}>
                {isOver ? "▲" : "▼"}
            </Text>
            <Text style={styles.lineValue}>{formatLine(pick.line)}</Text>
            <Text style={styles.lineMarket}>{statLabel(pick)}</Text>
        </View>
    )
}

/**
 * Where the pick stands: the stat so far, and the rate that implies.
 *
 * The raw share of the line cannot say whether that rate is any good — 30% of the line
 * is excellent in week 3 and dire in week 15 — so what is shown is the pace figure: the
 * share of the line reached over the share of the season played. 100% is exactly on
 * pace. Colour runs the same scale and flips for an under.
 *
 * "Tracking at 100%" is dead on the required rate, and the figure can sit well over 100%
 * long before the line itself is anywhere near reached.
 */
function PickStats({ pick }: { pick: SeasonPickResponseData }) {
    const pace = calculatePace(shapeOf(pick))
    const color = statColor(pick, pace)

    return (
        <View style={styles.pickTotalRow}>
            <Text style={[styles.pickTotal, { color }]}>{formatStat(pick.progress.total)}</Text>
            <Text style={styles.pickTotalUnit}>{countLabel(statLabel(pick), pick.progress.total)}</Text>
        </View>
    )
}

/**
 * What the rest of the season has to look like, per game.
 *
 * The tracking percentage cannot carry this on its own: it says whether the rate is
 * good without saying how much stat that actually is week to week.
 */
function requirementText(pick: SeasonPickResponseData): string | null {
    const needed = calculateRequirement(shapeOf(pick))
    if (!needed) return null

    // Wins are won whole and counted whole. A rate per game says nothing a team can act
    // on, so the requirement is stated as the games themselves.
    if (pick.kind === SeasonPickKind.TEAM_WINS) {
        const wins = `${formatStat(needed.remaining)} more ${needed.remaining === 1 ? "win" : "wins"}`
        return needed.atLeast ? `Needs ${wins}` : `Can afford ${wins}`
    }

    const bound = needed.atLeast ? "at least" : "under"
    const rate = formatRate(needed.perGame, needed.atLeast)
    // Plural regardless: a rate is "0.5 TDs a game", and the one-decimal "1.0" that would
    // trip a singular is still a rate rather than a count of one.
    return `Needs ${bound} ${rate} ${statLabel(pick)}/game`
}

/**
 * The two derived readings on one line: what the rest of the season has to look like,
 * and the rate reached so far. They answer the same question from either end, so they
 * sit on the same baseline rather than one hanging off the stat above it.
 */
function PaceBar({ pace, color }: { pace: Pace | null, color: string }) {
    if (!pace) return null

    // The literal share of the line reached, not the tracking figure beside it: the bar
    // answers "how much of the number is in the bag", which the pace percentage cannot,
    // since that one sits over 100% while the line is still most of a season away.
    // Clamped at full for a line already beaten.
    const filled = Math.max(0, Math.min(1, pace.toGoal))

    return (
        <View style={styles.paceTrack}>
            <View style={[styles.paceFill, { width: `${filled * 100}%`, backgroundColor: color }]} />
        </View>
    )
}

function PickFooter({ pick }: { pick: SeasonPickResponseData }) {
    const pace = calculatePace(shapeOf(pick))
    const color = statColor(pick, pace)
    const needs = requirementText(pick)

    return (
        <View style={styles.pickFooterBlock}>
            <View style={styles.pickFooter}>
                {needs !== null && <Text style={styles.needsLine}>{needs}</Text>}
                <Text style={[styles.pickPace, styles.pickPaceRight]}>
                    {pace
                        ? <>
                            {"Tracking at "}
                            <Text style={[styles.pickPaceValue, { color }]}>
                                {(pace.index * 100).toFixed(0)}%
                            </Text>
                        </>
                        : "—"}
                </Text>
            </View>
            <PaceBar pace={pace} color={color} />
        </View>
    )
}

/**
 * How many of a gambler's picks are on pace, over the picks that have started.
 *
 * A pick with no result yet has no rate to judge, so it is left out of both halves
 * rather than counted as behind — otherwise a season nobody has played would read as one
 * everybody is failing. Null when none have started, which is the same condition as every
 * card showing a dash.
 *
 * On pace is the rate at or past 100% for an over, and short of it for an under. The two
 * rules partition every started pick, so the pair always adds up.
 */
function trackingSummary(picks: SeasonPickResponseData[]): string | null {
    const started = picks
        .map(pick => ({ pick, pace: calculatePace(shapeOf(pick)) }))
        .filter((entry): entry is { pick: SeasonPickResponseData, pace: Pace } => entry.pace !== null)

    if (started.length === 0) return null

    const onPace = started.filter(({ pick, pace }) =>
        pick.direction === PropBetDirection.OVER ? pace.index >= 1 : pace.index < 1
    ).length

    return `${onPace}/${started.length} picks on track`
}

type GamblerCardProps = {
    name: string
    tracking: string | null
    pickCount: number
    allowance: number
    showAllowance: boolean
    children: React.ReactNode
}

/** One gambler's picks, collapsible so a five-person season stays scannable. Open by
 *  default, since seeing the picks is the point of the tab. */
function GamblerCard({ name, tracking, pickCount, allowance, showAllowance, children }: GamblerCardProps) {
    const [expanded, setExpanded] = useState(true)

    return (
        <View style={styles.card}>
            <Pressable style={styles.cardHeader} onPress={() => setExpanded(open => !open)}>
                <Text style={styles.gamblerName} numberOfLines={1}>{name}</Text>
                {tracking !== null && (
                    <Text style={styles.trackingCount}>{tracking}</Text>
                )}
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
                <View style={styles.headerRight}>
                    {!season.editable && <Text style={styles.headerNote}>Season closed</Text>}
                    {/* Anyone in the season, while it can still change. It rewrites results
                        across everyone's picks including weeks entered by hand, but ESPN
                        decides all of them, so there is nothing one gambler can do here to
                        another's pick that the next press would not do anyway. */}
                    {season.editable && (
                        <Pressable
                            onPress={season.sync}
                            disabled={season.syncing}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Update season pick progress from ESPN"
                            style={styles.syncButton}
                        >
                            <MaterialCommunityIcons
                                name="sync"
                                size={16}
                                color={season.syncing ? colors.textMuted : colors.accent}
                            />
                            <Text style={[styles.syncText, season.syncing && { color: colors.textMuted }]}>
                                Update progress
                            </Text>
                        </Pressable>
                    )}
                </View>
            </View>

            <RefreshableScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                onRefresh={season.reload}
                refreshing={season.loading}
            >
                {byGambler.map(({ gambler, picks }) => (
                    <GamblerCard
                        key={gambler.id}
                        name={gambler.firstName}
                        tracking={trackingSummary(picks)}
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
                                            {/* Purely additive here: target_name is the
                                                player or team on its own, with no "(ATL)"
                                                for the mark to replace. */}
                                            <TeamLogo team={pick.prop_bet_target.team_name} size={20} />
                                            <Text style={styles.pickTarget} numberOfLines={1}>{pick.target_name}</Text>
                                            {pick.is_finalized && <Text style={styles.lockedTag}>LOCKED</Text>}
                                        </View>
                                        <SeasonPickLine pick={pick} />
                                    </View>

                                    <PickStats pick={pick} />
                                </View>

                                <PickFooter pick={pick} />

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
            </RefreshableScrollView>

            {/* Over the whole screen rather than beside the button: a sync rewrites every
                gambler's weeks, so the list underneath is stale until it lands. */}
            {season.syncing && <OverlayLoader loaderProps={{ text: "Syncing..." }} />}

            {/* The modal closes as soon as the write lands, but the list is still being
                re-fetched behind it — without this the tab sits on stale rows with no
                sign that the new pick is on its way.

                Suppressed mid-sync: a sync ends by reloading, so for a moment both are
                true and two scrims stack into one twice as dark. The labelled one wins. */}
            {season.loading && season.initialized && !season.syncing && (
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
    headerRight: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    syncButton: {
        flexDirection: "row", alignItems: "center", gap: spacing.xs,
        paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
        borderRadius: 8, borderWidth: 1, borderColor: colors.cardBorder,
    },
    syncText: { ...typography.caption, color: colors.accent, fontWeight: "600" },
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
    trackingCount: { ...typography.caption, color: colors.textSecondary, fontWeight: "600" },
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
    pickRowMain: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
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
    pickTotalRow: {
        flexDirection: "row", alignItems: "baseline", justifyContent: "flex-end",
        gap: spacing.xs, minWidth: 96,
    },
    pickTotal: { ...typography.title },
    pickTotalUnit: { ...typography.caption, color: colors.textSecondary },
    pickFooterBlock: { gap: spacing.xs },
    pickFooter: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm },
    paceTrack: {
        height: 4, borderRadius: 2, overflow: "hidden",
        backgroundColor: colors.cardBorder,
    },
    paceFill: { height: "100%", borderRadius: 2 },
    pickPace: { ...typography.small, color: colors.textMuted },
    // Holds the rate to the right edge whether or not a requirement sits beside it.
    pickPaceRight: { marginLeft: "auto" },
    pickPaceValue: { fontWeight: "700" },
    needsLine: { ...typography.small, color: colors.textMuted, flexShrink: 1 },
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
