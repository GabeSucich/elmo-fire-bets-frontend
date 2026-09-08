import React from "react"
import { Pressable, Text, View } from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { colors, spacing, typography } from "@/theme/colors"

export type VoteDirection = 1 | -1

type Props = {
    /** Upvotes less downvotes. Shown on its own; the two tallies are never split out. */
    score: number
    /** -1, 0 or +1 — how the reader voted. */
    viewerVote: number
    disabled?: boolean
    /** Stacked for a list row, in a line for the detail sheet's action bar. */
    orientation?: "vertical" | "horizontal"
    onVote: (direction: VoteDirection) => void
}

const GLYPH_SIZE = 30
const SCORE_HEIGHT = 20

/**
 * Optical correction, measured off the rendered control rather than derived.
 *
 * Flexbox centres each mark in its own box, but a box is not where the ink is: the arrows
 * are an icon font drawn on a baseline and sit low in theirs. One offset explains both
 * symptoms — stacked, the number reads as nearer the up arrow; inline, the arrows sit
 * below the number — so it is corrected once, here, rather than per orientation.
 *
 * A transform so it moves the mark without moving the touch target it sits in.
 */
const ARROW_OPTICAL_LIFT = 3
/** The drawn box. Kept modest so the control does not set the card's height on its own. */
const BOX_WIDTH = 38
const BOX_HEIGHT = 26

/**
 * Slop is wider than it is tall, and the vertical half stays under half the score's line
 * height, so the two arrows' touch areas never meet across the number between them.
 */
const STACKED_SLOP = { top: 6, bottom: 6, left: 14, right: 14 }
/** Nothing sits close to it in the detail sheet, so it can spread evenly. */
const INLINE_SLOP = 12

function Arrow({ icon, active, disabled, onPress, label, hitSlop }: {
    icon: string
    active: boolean
    disabled?: boolean
    onPress: () => void
    label: string
    hitSlop: typeof STACKED_SLOP | number
}) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            hitSlop={hitSlop}
            accessibilityRole="button"
            accessibilityLabel={label}
            // A real box rather than a bare glyph: menu-up/down draw a small mark in a
            // tall line box, so without one the target is both smaller than it looks and
            // sitting in the wrong place. With the slop this clears 44pt either way.
            style={{
                width: BOX_WIDTH,
                height: BOX_HEIGHT,
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <MaterialCommunityIcons
                name={icon}
                size={GLYPH_SIZE}
                color={active ? colors.accent : colors.textMuted}
                style={{ lineHeight: GLYPH_SIZE, transform: [{ translateY: -ARROW_OPTICAL_LIFT }] }}
            />
        </Pressable>
    )
}

/**
 * The vote and the running total in one control.
 *
 * Tapping the arrow you already chose takes the vote back; tapping the other one changes
 * your mind in a single tap.
 */
export default function VoteControl({
    score, viewerVote, disabled, orientation = "vertical", onVote,
}: Props) {
    const vertical = orientation === "vertical"

    return (
        <View style={{
            flexDirection: vertical ? "column" : "row",
            alignItems: "center",
            gap: vertical ? 0 : spacing.xs,
            opacity: disabled ? 0.4 : 1,
        }}>
            <Arrow
                icon="menu-up" label="Upvote"
                active={viewerVote === 1} disabled={disabled}
                hitSlop={vertical ? STACKED_SLOP : INLINE_SLOP}
                onPress={() => onVote(1)}
            />
            <View style={{ height: SCORE_HEIGHT, justifyContent: "center" }}>
                <Text style={{
                    ...typography.body,
                    fontWeight: "700",
                    lineHeight: SCORE_HEIGHT,
                    minWidth: 20,
                    textAlign: "center",
                    color: viewerVote !== 0 && !disabled ? colors.accent : colors.textSecondary,
                }}>
                    {score}
                </Text>
            </View>
            <Arrow
                icon="menu-down" label="Downvote"
                active={viewerVote === -1} disabled={disabled}
                hitSlop={vertical ? STACKED_SLOP : INLINE_SLOP}
                onPress={() => onVote(-1)}
            />
        </View>
    )
}
