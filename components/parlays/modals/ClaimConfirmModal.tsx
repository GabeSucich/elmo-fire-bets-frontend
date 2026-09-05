import React from "react"
import { Text, View } from "react-native"
import AppModal from "@/components/reusable/AppModal"
import ActionButton from "../../reusable/ActionButton"
import { colors, shadows, spacing, typography } from "@/theme/colors"

type Props = {
    visible: boolean
    onCancel: () => void
    onConfirm: () => void
}

export default function ClaimConfirmModal({ visible, onCancel, onConfirm }: Props) {
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
                        Claim Parlay?
                    </Text>
                    <Text style={{
                        ...typography.body,
                        color: colors.textSecondary,
                        lineHeight: 22,
                        marginBottom: spacing.xl,
                        textAlign: 'center',
                    }}>
                        When you claim, it becomes your responsibility to place this parlay and enter any line corrections for picks.{"\n\n"}Ownership may be claimed by another gambler.
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.md }}>
                        <ActionButton text="Cancel" onPress={onCancel} color={colors.buttonSecondary} />
                        <ActionButton text="Claim parlay" onPress={onConfirm} />
                    </View>
                </View>
            </View>
        </AppModal>
    )
}
