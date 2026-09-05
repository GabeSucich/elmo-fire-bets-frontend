import React from "react"
import { Text, View } from "react-native"
import AppModal from "@/components/reusable/AppModal"
import ActionButton from "../../reusable/ActionButton"
import { colors, shadows, spacing, typography } from "@/theme/colors"

type Props = {
    visible: boolean
    onCancel: () => void
    onSubmit: () => void
}

export default function UnlockParlayModal({ visible, onCancel, onSubmit }: Props) {
    return (
        <AppModal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onCancel}
        >
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: colors.overlay,
            }}>
                <View style={{
                    width: '85%',
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: 20,
                    padding: spacing.xl,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    ...shadows.modal,
                }}>
                    <Text style={{
                        ...typography.heading,
                        color: colors.textPrimary,
                        marginBottom: spacing.md,
                        textAlign: 'center',
                    }}>
                        Unlock Parlay?
                    </Text>
                    <Text style={{
                        ...typography.body,
                        color: colors.textSecondary,
                        lineHeight: 22,
                        marginBottom: spacing.xl,
                        textAlign: 'center',
                    }}>
                        Setting this parlay back to the "Building" state will undo all pick corrections that may have been applied and delete all pick results. Any vetoes that were not approved will have to be recreated.
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.md }}>
                        <ActionButton text="Cancel" onPress={onCancel} color={colors.buttonSecondary} />
                        <ActionButton text="Unlock Parlay" onPress={onSubmit} color={colors.warning} />
                    </View>
                </View>
            </View>
        </AppModal>
    )
}
