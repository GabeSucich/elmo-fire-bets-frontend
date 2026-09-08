import React from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { PickReactionResponseData } from "@/api"
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import { colors, spacing, typography } from "@/theme/colors"
import { myEmoji } from "@/composables/usePickSocial"
import AddReactionButton from "./AddReactionButton"

type Props = {
    reactions: PickReactionResponseData[]
    commentCount: number
    /** A closed parlay still shows what it collected; it just stops taking anything new. */
    readOnly?: boolean
    /** Nobody reacts to their own bet. Display-only — see GamblerParlaySlot. */
    isOwnPick?: boolean
    onToggle: (emoji: string) => void
    onOpenThread: () => void
}

/**
 * The chips under a pick: what has been dropped on it, and a way into the argument.
 *
 * Ordered by when each emoji first appeared, which the server decides — so a chip holds its
 * place instead of sliding around as counts move under the reader's finger.
 */
export default function PickReactionBar({
    reactions, commentCount, readOnly = false, isOwnPick = false, onToggle, onOpenThread,
}: Props) {
    const { gamblerId } = useGamblingSeasonContext()
    // Both halves, not just the button: tapping someone else's chip would add yours to it,
    // which is the very thing being disallowed.
    const canReact = !readOnly && !isOwnPick

    return (
        // Separated from the pick by space rather than a rule: a horizontal line here would
        // use the same channel as the divider between gamblers, so the two separations
        // would read as peers when this one is plainly subordinate. The gap is wide enough
        // to group and comfortably narrower than the ~25px between slots.
        <View style={{ marginTop: spacing.sm }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                {/* Only the emoji scroll. A wrapping row grew the slot a line at a time and
                    pushed every gambler below it down the card, and the card animates its
                    own height — so a reaction landing would resize it under the reader.
                    flex:1 gives the scroller a definite width to scroll inside and keeps the
                    reply count pinned to the right whether there are two chips or twenty. */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        flexDirection: "row", alignItems: "center", gap: spacing.xs,
                    }}
                >
                    {/* Ahead of the chips rather than after them: a scroller rests at its
                        start, so leading with it keeps adding a reaction one tap away no
                        matter how far the chips run past the edge. */}
                    {canReact && (
                        <AddReactionButton onPick={onToggle} mine={myEmoji(reactions, gamblerId)} />
                    )}
                {reactions.map(reaction => {
                    const mine = reaction.gambler_ids.includes(gamblerId)
                    return (
                        <Pressable
                            key={reaction.emoji}
                            onPress={() => canReact && onToggle(reaction.emoji)}
                            disabled={!canReact}
                            hitSlop={6}
                            accessibilityRole="button"
                            accessibilityLabel={`${reaction.emoji} ${reaction.gambler_ids.length}`}
                            style={{
                                flexDirection: "row", alignItems: "center", gap: 3,
                                paddingHorizontal: spacing.sm, paddingVertical: 2,
                                // Never squeezed to fit: in a scroller the row is as wide as
                                // it needs to be, and shrinking would defeat the scrolling.
                                flexShrink: 0,
                                borderRadius: 10, borderWidth: 1,
                                // Your own reactions are outlined in the accent, so you can
                                // see what you left without counting yourself in the names.
                                borderColor: mine ? colors.accent : colors.cardBorder,
                                backgroundColor: mine ? colors.backgroundSecondary : "transparent",
                            }}
                        >
                            <Text style={{ fontSize: 14 }}>{reaction.emoji}</Text>
                            {/* A lone "1" beside every chip is noise: one is what a chip
                                already means, so the number only earns its place once it
                                says something the emoji does not. The accessible label
                                still carries the count either way. */}
                            {reaction.gambler_ids.length > 1 && (
                                <Text style={{
                                    ...typography.caption,
                                    color: mine ? colors.accent : colors.textMuted,
                                    fontWeight: "600",
                                }}>
                                    {reaction.gambler_ids.length}
                                </Text>
                            )}
                        </Pressable>
                    )
                })}

                </ScrollView>

                {/* Outside it, and so always reachable. Shown at zero too: an empty count is
                    what tells you nobody has said anything yet, which is worth knowing. */}
                <Pressable
                    onPress={onOpenThread}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`${commentCount} replies`}
                    style={{
                        flexDirection: "row", alignItems: "center", gap: 3,
                        paddingVertical: 2, flexShrink: 0,
                    }}
                >
                    <MaterialCommunityIcons name="comment-outline" size={16} color={colors.textMuted} />
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>
                        {commentCount}
                    </Text>
                </Pressable>
            </View>

        </View>
    )
}
