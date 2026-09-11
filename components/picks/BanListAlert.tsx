import AppModal from "@/components/reusable/AppModal"
import { colors, shadows, spacing, typography } from "@/theme/colors"
import { BanListPlacement } from "@/util/trends"
import React, { useState } from "react"
import { Pressable, Text, TouchableOpacity, View } from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"

type Props = {
    gamblerName: string
    placement: BanListPlacement
    /** Someone else's bad pick is a veto opportunity; your own is just a warning. */
    isOwnPick: boolean
}

/** The list is capped at three, so this only ever has to reach "3rd". */
function ordinal(rank: number) {
    if (rank === 1) return "1st"
    if (rank === 2) return "2nd"
    if (rank === 3) return "3rd"
    return `${rank}th`
}

/**
 * Warns that a pick lands on a player the gambler is historically bad on.
 *
 * The list is the same one the Trends tab shows, computed from the same builder, so the two
 * can never name different players.
 */
export default function BanListAlert({ gamblerName, placement, isOwnPick }: Props) {
    const [visible, setVisible] = useState(false)
    const { entry, rank } = placement

    return (
        <>
            {/* Just the mark, sitting with the bet it is about. A labelled banner on its own
                row said the same thing at several times the weight, and a parlay can carry
                one of these per gambler — five of them stacked down a card drowned out the
                picks themselves. What it means is one tap away. */}
            <TouchableOpacity
                onPress={() => setVisible(true)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Ban list alert for ${gamblerName}`}
                activeOpacity={0.7}
            >
                <MaterialCommunityIcons name="alert" size={16} color={colors.danger} />
            </TouchableOpacity>

            <AppModal
                visible={visible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setVisible(false)}
            >
                <Pressable
                    onPress={() => setVisible(false)}
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: colors.overlay,
                        padding: spacing.xl,
                    }}
                >
                    <View style={{
                        width: '100%',
                        backgroundColor: colors.backgroundSecondary,
                        borderRadius: 20,
                        padding: spacing.xl,
                        borderWidth: 1,
                        borderColor: colors.danger,
                        gap: spacing.md,
                        ...shadows.modal,
                    }}>
                        {/* The header carries the warning now, so there is no separate title. */}
                        <Text style={{ ...typography.title, color: colors.textPrimary }}>
                            {entry.name} is on {gamblerName}’s{' '}
                            <Text style={{ color: colors.danger }}>ban list</Text>
                        </Text>

                        <Text style={{ ...typography.body, color: colors.textSecondary }}>
                            A {entry.winRate.toFixed(0)}% hit rate on {entry.name} props is{' '}
                            {gamblerName}’s {ordinal(rank)} worst overall.
                        </Text>

                        {!isOwnPick && (
                            <Text style={{
                                ...typography.body,
                                color: colors.warning,
                                fontWeight: '700',
                            }}>Time for a veto?</Text>
                        )}

                        <TouchableOpacity
                            onPress={() => setVisible(false)}
                            style={{
                                backgroundColor: colors.buttonSecondary,
                                paddingVertical: spacing.sm,
                                borderRadius: 8,
                                alignItems: 'center',
                                marginTop: spacing.xs,
                            }}
                        >
                            <Text style={{ color: colors.textPrimary, ...typography.body, fontWeight: '600' }}>
                                Got it
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </AppModal>
        </>
    )
}
