import React from "react"
import { Text, View } from "react-native"
import AppModal from "@/components/reusable/AppModal"
import ActionButton from "@/components/reusable/ActionButton"
import { colors, shadows, spacing, typography } from "@/theme/colors"

type Props = {
    visible: boolean
    onClose: () => void
    minTargetPicks: number
    minTrustyPicks: number
    minPropPicks: number
    minTDTargetPicks: number
}

function Rule({ children }: { children: React.ReactNode }) {
    return (
        <Text style={{ ...typography.body, color: colors.textSecondary, lineHeight: 20 }}>
            {children}
        </Text>
    )
}

export default function TrendsInfoModal({
    visible,
    onClose,
    minTargetPicks,
    minTrustyPicks,
    minPropPicks,
    minTDTargetPicks,
}: Props) {
    return (
        <AppModal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <View style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: colors.overlay,
                padding: spacing.lg,
            }}>
                <View style={{
                    width: "100%",
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: 20,
                    padding: spacing.xl,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    gap: spacing.sm,
                    ...shadows.modal,
                }}>
                    <Text style={{ ...typography.heading, color: colors.textPrimary }}>
                        How trends are calculated
                    </Text>

                    <Rule>• Players need {minTargetPicks} settled picks, props {minPropPicks}.</Rule>
                    <Rule>• Ol&apos; Trusties just counts picks — {minTrustyPicks}+ to appear.</Rule>
                    <Rule>• Pushes and voids don&apos;t count as settled.</Rule>
                    <Rule>• Good lists are above 50%, bad lists below. Exactly 50% shows in neither.</Rule>
                    <Rule>• TD slates are separate ({minTDTargetPicks}+ picks) and stay out of the other lists.</Rule>

                    <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: spacing.md }}>
                        <ActionButton text="Got it" onPress={onClose} color={colors.buttonSecondary} />
                    </View>
                </View>
            </View>
        </AppModal>
    )
}
