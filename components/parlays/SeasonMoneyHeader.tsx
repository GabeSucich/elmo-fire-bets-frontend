import React from "react"
import { Text, View } from "react-native"
import { usePerformancesContext } from "@/contexts/performancesContext"
import { money } from "@/util/payout"
import { colors, spacing, typography } from "@/theme/colors"

/**
 * Where the season stands, per person.
 *
 * Pinned above the closed list rather than scrolling with it: it is the answer to the
 * question the tab exists to ask, and a total you have to scroll back up to check is one
 * nobody checks. Computed on the server, because the list below is paged and adding up a
 * page would report a tenth of the season as though it were the whole of it.
 */
export default function SeasonMoneyHeader() {
    const { seasonNetPp, winsMissingPayout } = usePerformancesContext()
    const up = seasonNetPp > 0

    return (
        <View style={{
            flexDirection: "row",
            alignItems: "center",
            gap: spacing.sm,
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.sm,
            backgroundColor: colors.backgroundSecondary,
            borderBottomWidth: 1,
            borderBottomColor: colors.cardBorder,
        }}>
            {/* Said out loud, because a total missing a win reads as a season that simply
                went worse rather than as one nobody has finished recording. */}
            {winsMissingPayout > 0 && (
                <Text style={{ ...typography.small, color: colors.warning }}>
                    {winsMissingPayout} win{winsMissingPayout === 1 ? "" : "s"} missing $
                </Text>
            )}
            {/* Unlabelled. It sits above a column of per-lay figures and adds them up, in
                the same place and the same colours, which says what it is without a word. */}
            <Text style={{
                ...typography.heading,
                fontWeight: "700",
                marginLeft: "auto",
                color: seasonNetPp === 0 ? colors.textSecondary : up ? colors.success : colors.danger,
            }}>
                {up ? "+ " : seasonNetPp < 0 ? "− " : ""}{money(Math.abs(seasonNetPp))}
            </Text>
        </View>
    )
}
