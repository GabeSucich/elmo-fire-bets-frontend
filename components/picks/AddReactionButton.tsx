import React, { useRef, useState } from "react"
import { Pressable, View } from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import Popover, { PopoverAnchor } from "@/components/reusable/Popover"
import { colors, spacing } from "@/theme/colors"
import ReactionPalette from "./ReactionPalette"

type Props = {
    onPick: (emoji: string) => void
    /** What the reader has already left, so the palette can offer taking it back. */
    mine?: string[]
    /** Larger in the drawer, where it stands on its own rather than beside chips. */
    iconSize?: number
}

/**
 * Opens the palette over the app, anchored to itself.
 *
 * Owns the measuring and the popover so both the chip row on a card and the drawer get the
 * same behaviour from one place — they had identical needs, and the second copy would have
 * drifted.
 */
export default function AddReactionButton({ onPick, mine, iconSize = 22 }: Props) {
    // Where the palette hangs from, measured on the way open. Null while closed.
    const [anchor, setAnchor] = useState<PopoverAnchor | null>(null)
    const button = useRef<View>(null)

    return (
        <>
            <Pressable
                ref={button}
                onPress={() => button.current?.measureInWindow((x, y, width, height) =>
                    setAnchor({ x, y, width, height })
                )}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Add a reaction"
                style={{
                    flexDirection: "row", alignItems: "center", gap: spacing.sm,
                    paddingHorizontal: spacing.xs, paddingVertical: 4,
                }}
            >
                <MaterialCommunityIcons
                    name="emoticon-plus-outline"
                    size={iconSize}
                    color={anchor ? colors.accent : colors.textMuted}
                />
            </Pressable>

            {/* Floated rather than opened in place: a block appearing inline would push
                everything below it down, and both the card and the sheet are height-managed,
                so they would resize under whoever tapped. */}
            {/* Stays open across taps. Reactions are optimistic, so the ring the palette
                draws round what you already hold follows each tap immediately — leaving it
                up turns picking three into three taps rather than three round trips through
                the button. Tapping outside is the way out. */}
            <Popover anchor={anchor} onClose={() => setAnchor(null)} fillWidth>
                <ReactionPalette mine={mine} onPick={onPick} />
            </Popover>
        </>
    )
}
