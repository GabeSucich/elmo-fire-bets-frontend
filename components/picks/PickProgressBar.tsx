import React from "react"
import { Text, View } from "react-native"
import { PickResponseData } from "@/api"
import { pickProgress } from "@/util/pickProgress"
import { countLabel, formatStat } from "@/util/statFormat"
import { colors, spacing, typography } from "@/theme/colors"

type Props = {
    pick: PickResponseData
}

/**
 * How a leg is actually doing, once somebody has synced the parlay.
 *
 * Renders nothing at all until then, and nothing for a leg whose player never appeared —
 * an empty bar would say "no progress" where the truth is "no game", and those are not the
 * same thing to anyone reading the card.
 */
export default function PickProgressBar({ pick }: Props) {
    const progress = pickProgress(pick)
    if (progress === null) return null

    return (
        <View style={{ gap: 3, marginTop: spacing.xs }}>
            <Text style={{
                ...typography.small,
                color: progress.label ? colors.textMuted : progress.color,
                fontWeight: "600",
                // Over the end the bar is travelling towards, so the number and the thing
                // it describes finish in the same place.
                textAlign: "right",
            }}>
                {progress.label ?? `${formatStat(progress.value!)} ${countLabel(pick.prop_type, progress.value!)}`}
            </Text>
            <View style={{
                height: 4,
                borderRadius: 2,
                overflow: "hidden",
                backgroundColor: colors.cardBorder,
            }}>
                <View style={{
                    height: "100%",
                    borderRadius: 2,
                    width: `${progress.filled * 100}%`,
                    backgroundColor: progress.color,
                }} />
            </View>
        </View>
    )
}
