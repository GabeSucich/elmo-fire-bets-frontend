import React from "react"
import { Text, View } from "react-native"
import AppModal from "@/components/reusable/AppModal"
import ActionButton from "../../reusable/ActionButton"
import { useParlaysContext } from "@/contexts/parlaysContext"
import { colors, shadows, spacing, typography } from "@/theme/colors"

type Props = {
    visible: boolean
    parlayId: number
    onCancel: () => void
}

export default function ReopenParlayModal({ visible, parlayId, onCancel }: Props) {
    const {
        reopenParlay,
        refreshParlays,
        navToTab,
        setFocusedParlayId
    } = useParlaysContext()

    function handleReopen() {
        onCancel()
        reopenParlay(parlayId, () => {
            refreshParlays()
            navToTab("Open")
            setFocusedParlayId(parlayId)
        })
    }

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
                        Reopen Parlay?
                    </Text>
                    <Text style={{
                        ...typography.body,
                        color: colors.textSecondary,
                        lineHeight: 22,
                        marginBottom: spacing.xl,
                        textAlign: 'center',
                    }}>
                        Do you want to reopen the parlay? This will require you to re-enter the parlay result in the "Open" tab.
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.md }}>
                        <ActionButton text="Cancel" onPress={onCancel} color={colors.buttonSecondary} />
                        <ActionButton text="Reopen Parlay" onPress={handleReopen} color={colors.warning} />
                    </View>
                </View>
            </View>
        </AppModal>
    )
}
