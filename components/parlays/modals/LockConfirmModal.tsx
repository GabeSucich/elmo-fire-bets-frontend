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

export default function LockConfirmModal({ visible, onCancel, onConfirm }: Props) {
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
                        Ready to lock?
                    </Text>
                    <Text style={{
                        ...typography.body,
                        color: colors.textSecondary,
                        lineHeight: 22,
                        marginBottom: spacing.xl,
                        textAlign: 'center',
                    }}>
                        Are you sure you want to lock in this lay? This will not allow any other gamblers to edit their picks, and you will be responsible for entering all corrected bets and lines after placing.{"\n\n"}Ownership may be claimed by another gambler.
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.md }}>
                        <ActionButton text="Cancel" onPress={onCancel} color={colors.buttonSecondary} />
                        <ActionButton text="Lock parlay" onPress={onConfirm} />
                    </View>
                </View>
            </View>
        </AppModal>
    )
}
