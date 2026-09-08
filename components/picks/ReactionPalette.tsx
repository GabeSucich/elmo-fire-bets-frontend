import React from "react"
import { Pressable, ScrollView, Text } from "react-native"
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import { colors, spacing } from "@/theme/colors"

type Props = {
    onPick: (emoji: string) => void
    /**
     * What the reader has already left. Ringed here because tapping one of these takes it
     * back — with reactions shown grouped by person, this is the only place that undo lives.
     */
    mine?: string[]
}

/**
 * The emoji a pick can be reacted with.
 *
 * The set comes from the season response rather than a constant here, so the picker cannot
 * offer something the server would reject.
 */
export default function ReactionPalette({ onPick, mine = [] }: Props) {
    const { reactionPalette } = useGamblingSeasonContext()

    return (
        // One line that scrolls rather than a block that wraps: the palette can grow, and
        // a second row would change the popover's height and flip which side of the
        // trigger it opens on.
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
                flexDirection: "row", alignItems: "center", gap: spacing.xs,
            }}
        >
            {reactionPalette.map(emoji => {
                const chosen = mine.includes(emoji)
                return (
                    <Pressable
                        key={emoji}
                        onPress={() => onPick(emoji)}
                        hitSlop={4}
                        accessibilityRole="button"
                        accessibilityLabel={chosen ? `Remove ${emoji}` : `React ${emoji}`}
                        // Never squeezed to fit: in a scroller the row is as wide as it needs
                        // to be, and shrinking would defeat the scrolling.
                        style={{
                            paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, flexShrink: 0,
                            borderRadius: 8, borderWidth: 1,
                            borderColor: chosen ? colors.accent : "transparent",
                        }}
                    >
                        <Text style={{ fontSize: 24 }}>{emoji}</Text>
                    </Pressable>
                )
            })}
        </ScrollView>
    )
}
