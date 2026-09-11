import React, { useState } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { AdminService, SyncPlayersResponseData } from "@/api"
import OverlayLoader from "@/components/reusable/OverlayLoader"
import useApiActionState from "@/composables/useApiActionState"
import { colors, shadows, spacing, typography } from "@/theme/colors"

/**
 * League-wide upkeep, for whoever runs it.
 *
 * Its own screen rather than a corner of the season tabs: nothing here is scoped to a
 * season, and an action that rewrites a few hundred shared rows should not sit next to
 * the ones a gambler presses every week.
 */
export default function AdminView() {
    const [running, setRunning] = useState(false)
    const [result, setResult] = useState<SyncPlayersResponseData | null>(null)

    const { execute: syncPlayers } = useApiActionState(
        AdminService.syncPlayers,
        setResult,
        setRunning,
        "There was an error syncing players"
    )

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <MaterialCommunityIcons name="account-sync" size={20} color={colors.accent} />
                        <Text style={styles.cardTitle}>Sync players</Text>
                    </View>
                    <Text style={styles.cardBody}>
                        Updates every player’s team from ESPN and matches any the app
                        hasn’t seen before. Anyone who has moved will show their new team
                        on old picks too.
                    </Text>
                    <Pressable
                        onPress={() => syncPlayers()}
                        disabled={running}
                        style={[styles.button, running && styles.buttonDisabled]}
                    >
                        <Text style={styles.buttonText}>
                            {running ? "Syncing..." : "Sync players"}
                        </Text>
                    </Pressable>
                </View>

                {result && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Last run</Text>
                        <Text style={styles.resultLine}>
                            {result.targets_seen} players checked
                        </Text>
                        <Text style={styles.resultLine}>
                            {result.ids_resolved} newly matched to ESPN
                        </Text>
                        <Text style={styles.resultLine}>
                            {result.team_changes.length} team{result.team_changes.length === 1 ? "" : "s"} corrected
                        </Text>
                        {result.team_changes.map(change => (
                            <Text key={change} style={styles.detailLine}>· {change}</Text>
                        ))}
                        {/* The list worth acting on: a player ESPN cannot find stays
                            invisible to every later sync until the name is fixed. */}
                        {result.ids_failed.length > 0 && (
                            <>
                                <Text style={[styles.resultLine, { color: colors.warning }]}>
                                    {result.ids_failed.length} not found on ESPN
                                </Text>
                                {result.ids_failed.map(name => (
                                    <Text key={name} style={styles.detailLine}>· {name}</Text>
                                ))}
                            </>
                        )}
                    </View>
                )}
            </ScrollView>

            {running && <OverlayLoader loaderProps={{ text: "Syncing players..." }} />}
        </View>
    )
}

const styles = {
    container: { flex: 1, backgroundColor: colors.background } as const,
    content: { padding: spacing.lg, gap: spacing.md } as const,
    card: {
        backgroundColor: colors.card, borderRadius: 16, padding: spacing.lg,
        borderWidth: 1, borderColor: colors.cardBorder, gap: spacing.sm, ...shadows.card,
    } as const,
    cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm } as const,
    cardTitle: { ...typography.heading, color: colors.textPrimary } as const,
    cardBody: { ...typography.body, color: colors.textSecondary } as const,
    button: {
        alignSelf: "flex-start", marginTop: spacing.xs,
        paddingVertical: spacing.sm, paddingHorizontal: spacing.lg,
        borderRadius: 14, backgroundColor: colors.accentDark,
        borderWidth: 1, borderColor: colors.accent,
    } as const,
    buttonDisabled: { opacity: 0.6 } as const,
    buttonText: { ...typography.body, color: colors.textPrimary, fontWeight: "600" } as const,
    resultLine: { ...typography.body, color: colors.textPrimary } as const,
    detailLine: { ...typography.caption, color: colors.textSecondary, paddingLeft: spacing.sm } as const,
}
