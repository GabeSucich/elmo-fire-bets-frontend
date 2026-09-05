import { useEffect } from "react"
import { Pressable, Text } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"
import { ToastItem, ToastSeverity } from "@/contexts/toastContext"
import { colors, shadows, spacing, typography } from "@/theme/colors"

type Palette = {
    background: string
    border: string
    text: string
}

const severityPalettes: Record<ToastSeverity, Palette> = {
    error: { background: colors.dangerLight, border: colors.danger, text: colors.dangerDark },
    success: { background: colors.successLight, border: colors.success, text: colors.successDark },
    info: { background: colors.card, border: colors.cardBorder, text: colors.textPrimary },
}

type Props = {
    toast: ToastItem
    onDismiss: () => void
    /** Runs the toast's action and clears it — a retry that succeeds shouldn't leave its own error on screen. */
    onAction: () => void
}

export default function Toast({ toast, onDismiss, onAction }: Props) {
    const palette = severityPalettes[toast.severity]
    const entrance = useSharedValue(0)

    useEffect(() => {
        entrance.value = withTiming(1, { duration: 180 })
    }, [entrance])

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: entrance.value,
        transform: [{ translateY: (1 - entrance.value) * 12 }],
    }))

    return (
        <Animated.View style={[
            animatedStyle,
            {
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                backgroundColor: palette.background,
                borderWidth: 1,
                borderColor: palette.border,
                borderRadius: 12,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
                marginTop: spacing.sm,
                ...shadows.card,
            },
        ]}>
            <Text style={{ flex: 1, color: palette.text, ...typography.body }}>{ toast.message }</Text>
            {
                toast.action && (
                    <Pressable onPress={onAction} hitSlop={8}>
                        <Text style={{ color: palette.text, ...typography.heading, textDecorationLine: 'underline' }}>
                            { toast.action.label }
                        </Text>
                    </Pressable>
                )
            }
            <Pressable onPress={onDismiss} hitSlop={8}>
                <Text style={{ color: palette.text, fontSize: 18, lineHeight: 20 }}>×</Text>
            </Pressable>
        </Animated.View>
    )
}
