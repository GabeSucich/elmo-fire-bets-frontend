import React from "react"
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { colors, typography, spacing, shadows } from "@/theme/colors"

/**
 * Fixed height for a button's contents, so a glyph and a label produce the same button.
 * An icon's line box is taller than caption text, which left the lock button standing
 * proud of the CTAs beside it.
 */
const CONTENT_HEIGHT = 18
const ICON_SIZE = 16

/**
 * The box an ActionButton draws, without the button.
 *
 * Exported so a label that sits in a row of buttons but does nothing — "Owned by Mark" —
 * stands exactly as tall as they do. Copying the padding into the caller is how the two
 * end up a pixel apart the next time either is touched.
 */
export const buttonBoxStyle = {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
} as const

/** The line box inside it, so text in a static badge sits where a button's label does. */
export const buttonContentStyle = {
    height: CONTENT_HEIGHT,
    justifyContent: 'center',
} as const

export const buttonLabelStyle = {
    ...typography.caption,
    lineHeight: CONTENT_HEIGHT,
} as const

type Props = {
    /** Optional when `icon` is given: an icon-only button still gets the same fill. */
    text?: string
    /** MaterialCommunityIcons name, rendered in place of the label. */
    icon?: string
    /** Spoken label for an icon-only button, which has no text to read. */
    accessibilityLabel?: string
    onPress: () => void
    color?: string
    disabled?: boolean
    disabledColor?: string
    /**
     * Swaps the label for a spinner and blocks presses. Kept on the button rather than
     * behind an overlay so the wait is attached to the thing that was tapped.
     */
    loading?: boolean
}

export default function ActionButton({
    text,
    icon,
    accessibilityLabel,
    onPress,
    color = colors.accent,
    disabled,
    disabledColor = colors.buttonDisabled,
    loading,
}: Props) {
    const inactive = disabled || loading

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={inactive}
            style={{ opacity: inactive ? 0.5 : 1 }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? text}
        >
            <View style={{
                backgroundColor: inactive ? disabledColor : color,
                ...buttonBoxStyle,
                ...shadows.card,
            }}>
                {/* Kept in place while loading so the button holds its width instead of
                    collapsing around the spinner. */}
                <View style={{
                    height: CONTENT_HEIGHT,
                    opacity: loading ? 0 : 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    {icon ? (
                        <MaterialCommunityIcons
                            name={icon}
                            size={ICON_SIZE}
                            color={colors.textPrimary}
                            style={{ lineHeight: ICON_SIZE }}
                        />
                    ) : (
                        <Text style={{
                            ...typography.caption,
                            color: colors.textPrimary,
                            fontWeight: '600',
                            lineHeight: CONTENT_HEIGHT,
                        }}>{text}</Text>
                    )}
                </View>
                {loading && (
                    <View style={{
                        ...StyleSheet.absoluteFillObject,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <ActivityIndicator size="small" color={colors.textPrimary} />
                    </View>
                )}
            </View>
        </TouchableOpacity>
    )
}
