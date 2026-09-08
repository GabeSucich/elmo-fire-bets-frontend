import React from "react"
import { Pressable } from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { ACTION_ICON_SIZE, spacing } from "@/theme/colors"

type Props = {
    icon: string
    label: string
    color: string
    size?: number
    onPress: () => void
}

/** A bare glyph with a real touch target under it. */
export default function IconAction({ icon, label, color, size = ACTION_ICON_SIZE, onPress }: Props) {
    return (
        <Pressable
            onPress={onPress}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={{ padding: spacing.xs }}
        >
            <MaterialCommunityIcons name={icon} size={size} color={color} />
        </Pressable>
    )
}
