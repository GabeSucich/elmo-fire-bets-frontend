import React from "react"
import { Pressable, Text, View } from "react-native"
import { colors, spacing, typography } from "@/theme/colors"

/** A two-tap delete, in place. Losing a suggestion or a reply to one stray tap is not worth it. */
export default function ConfirmDelete({ onConfirm, onCancel }: {
    onConfirm: () => void
    onCancel: () => void
}) {
    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>Delete?</Text>
            <Pressable onPress={onCancel} hitSlop={8}>
                <Text style={{ ...typography.caption, color: colors.textSecondary }}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onConfirm} hitSlop={8}>
                <Text style={{ ...typography.caption, color: colors.danger, fontWeight: "600" }}>Delete</Text>
            </Pressable>
        </View>
    )
}
