import React from "react"
import { Pressable, Text, View } from "react-native"
import AppModal from "@/components/reusable/AppModal"
import ActionButton from "../../reusable/ActionButton"
import { colors, shadows, spacing, typography } from "@/theme/colors"

type Props = {
    visible: boolean
    onCancel: () => void
    /** Adds the slip first; locking happens once those adjustments are submitted. */
    onAddSlip: () => void
    /** Locks now and leaves the slip for later. */
    onLockWithoutSlip: () => void
}

export default function LockConfirmModal({ visible, onCancel, onAddSlip, onLockWithoutSlip }: Props) {
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
                    {/* Dismissal sits in the corner like the other modals, so the actions
                        below are the three things you might actually want to do. */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', width: '100%' }}>
                        <Text style={{
                            ...typography.heading,
                            color: colors.textPrimary,
                            marginBottom: spacing.md,
                            textAlign: 'center',
                            flex: 1,
                        }}>
                            Ready to lock?
                        </Text>
                        <Pressable
                            onPress={onCancel}
                            style={{ padding: spacing.xs, marginTop: -spacing.xs }}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Close"
                        >
                            <Text style={{ fontSize: 22, color: colors.textSecondary }}>x</Text>
                        </Pressable>
                    </View>
                    <Text style={{
                        ...typography.body,
                        color: colors.textSecondary,
                        lineHeight: 22,
                        marginBottom: spacing.xl,
                        textAlign: 'center',
                    }}>
                        Locking stops other gamblers editing their picks, and makes you responsible for entering the bets and lines as they were actually placed.
                    </Text>
                    {/* Adding the slip is the path worth taking, so it carries the accent and
                        the alternatives sit neutral beside it. */}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        gap: spacing.sm,
                    }}>
                        <ActionButton text="Add slip later" onPress={onLockWithoutSlip} color={colors.buttonSecondary} />
                        <ActionButton text="Add parlay slip" onPress={onAddSlip} />
                    </View>
                </View>
            </View>
        </AppModal>
    )
}
