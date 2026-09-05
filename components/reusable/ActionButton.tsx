import React from "react"
import { Text, TouchableOpacity, View } from "react-native"
import { colors, typography, spacing, shadows } from "@/theme/colors"

type Props = {
    text: string
    onPress: () => void
    color?: string
    disabled?: boolean
    disabledColor?: string
}

export default function ActionButton({ text, onPress, color = colors.accent, disabled, disabledColor = colors.buttonDisabled }: Props) {
    return (
        <TouchableOpacity onPress={onPress} disabled={disabled} style={{ opacity: disabled ? 0.5 : 1 }} activeOpacity={0.7}>
            <View style={{
                backgroundColor: disabled ? disabledColor : color,
                paddingVertical: spacing.sm,
                paddingHorizontal: spacing.md,
                borderRadius: 8,
                ...shadows.card,
            }}>
                <Text style={{
                    color: colors.textPrimary,
                    fontWeight: '600',
                    ...typography.caption,
                }}>{text}</Text>
            </View>
        </TouchableOpacity>
    )
}
