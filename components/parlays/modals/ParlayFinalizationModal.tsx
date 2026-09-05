import React from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import AppModal from "@/components/reusable/AppModal"
import ParlayFinalization from "../ParlayFinalization"
import { ParlayResponseData } from "@/api"
import { colors, shadows, spacing, typography } from "@/theme/colors"

type Props = {
    visible: boolean
    dismissModal: () => void
    parlay: ParlayResponseData
}

export default function ParlayFinalizationModal({ visible, dismissModal, parlay }: Props) {
    return (
        <AppModal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={dismissModal}
        >
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: colors.overlay,
            }}>
                <View style={{
                    width: '90%',
                    maxHeight: '85%',
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: 20,
                    padding: spacing.xl,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    ...shadows.modal,
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                        <Text style={{ ...typography.title, color: colors.textPrimary }}>Finalize Parlay</Text>
                        <Pressable onPress={dismissModal} style={{ padding: spacing.xs }}>
                            <Text style={{ fontSize: 22, color: colors.textSecondary }}>x</Text>
                        </Pressable>
                    </View>
                    <ScrollView style={{ width: '100%' }}>
                        <ParlayFinalization parlay={parlay} onDone={dismissModal} />
                    </ScrollView>
                </View>
            </View>
        </AppModal>
    )
}
