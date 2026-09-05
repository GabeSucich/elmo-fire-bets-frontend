import React from "react"
import { ScrollView, Text, View } from "react-native"
import AppModal from "@/components/reusable/AppModal"
import ActionButton from "@/components/reusable/ActionButton"
import { colors, shadows, spacing, typography } from "@/theme/colors"

type Props = {
    visible: boolean
    onClose: () => void
    minTargetPicks: number
    minPropPicks: number
    minTDWins: number
    minTDLosses: number
}

type TrendExplainer = {
    emoji: string
    title: string
    description: string
}

type TrendGroup = {
    tab: string
    trends: TrendExplainer[]
}

function buildGroups({
    minTargetPicks,
    minPropPicks,
    minTDWins,
    minTDLosses,
}: Omit<Props, "visible" | "onClose">): TrendGroup[] {
    return [
        {
            tab: "Props",
            trends: [
                {
                    emoji: "🎯",
                    title: "Can't Miss",
                    description: `The bet types you hit on the most, over at least ${minPropPicks} picks.`,
                },
                {
                    emoji: "😈",
                    title: "Love the Pain",
                    description: `The bet types you hit on the least, same ${minPropPicks}-pick minimum.`,
                },
            ],
        },
        {
            tab: "Players",
            trends: [
                {
                    emoji: "🤝",
                    title: "Ol' Trusties",
                    description: `The players you hit on the most, once you have picked them ${minTargetPicks} times.`,
                },
                {
                    emoji: "🚫",
                    title: "Ban List",
                    description: `The players you hit on the least, same ${minTargetPicks}-pick minimum.`,
                },
            ],
        },
        {
            tab: "TDs",
            trends: [
                {
                    emoji: "🤑",
                    title: "Cashed In",
                    description: `The players who landed the most touchdowns for you, from ${minTDWins} wins up.`,
                },
                {
                    emoji: "💀",
                    title: "Burned By",
                    description: `The players who cost you the most touchdown picks, from ${minTDLosses} losses up.`,
                },
            ],
        },
    ]
}

export default function TrendsInfoModal({ visible, onClose, ...thresholds }: Props) {
    const groups = buildGroups(thresholds)

    return (
        <AppModal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <View style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: colors.overlay,
                padding: spacing.lg,
            }}>
                <View style={{
                    width: "100%",
                    maxHeight: "85%",
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: 20,
                    padding: spacing.xl,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    ...shadows.modal,
                }}>
                    <ScrollView style={{ flexGrow: 0 }}>
                        {groups.map(group => (
                            <View key={group.tab} style={{ marginBottom: spacing.lg }}>
                                <Text style={{
                                    ...typography.title,
                                    color: colors.textPrimary,
                                    marginBottom: spacing.sm,
                                }}>
                                    {group.tab}
                                </Text>

                                {group.trends.map(trend => (
                                    <View key={trend.title} style={{ marginBottom: spacing.md, gap: 2 }}>
                                        <Text style={{
                                            ...typography.body,
                                            color: colors.textPrimary,
                                            fontWeight: "600",
                                        }}>
                                            {trend.emoji} {trend.title}
                                        </Text>
                                        <Text style={{
                                            ...typography.body,
                                            color: colors.textSecondary,
                                            lineHeight: 20,
                                        }}>
                                            {trend.description}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ))}

                        <Text style={{
                            ...typography.caption,
                            color: colors.textMuted,
                            fontStyle: "italic",
                            lineHeight: 18,
                        }}>
                            Only picks that won or lost count toward these totals — pushes and voids sit them out.
                        </Text>
                    </ScrollView>

                    <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: spacing.lg }}>
                        <ActionButton text="Got it" onPress={onClose} color={colors.buttonSecondary} />
                    </View>
                </View>
            </View>
        </AppModal>
    )
}
