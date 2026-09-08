import React from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import AppModal from "@/components/reusable/AppModal"
import ParlayPickCorrections from "../ParlayPickCorrections"
import { ParlayResponseData } from "@/api"
import { useParlaysContext } from "@/contexts/parlaysContext"
import { colors, shadows, spacing, typography } from "@/theme/colors"

type Props = {
    visible: boolean
    dismissModal: () => void
    parlay: ParlayResponseData
    /** Reached from locking: the slip is the only route, and finishing locks the parlay. */
    locking?: boolean
    /** Fired only when adjustments were actually saved, never on a plain dismissal. */
    onSubmitted?: () => void
}

export default function PickCorrectionsModal({ visible, dismissModal, parlay, locking, onSubmitted }: Props) {
    const { refreshParlay } = useParlaysContext()

    /**
     * Adjustments are written straight to the server, but the parlay behind this modal is
     * still holding its pre-adjustment picks. Every way out has to refresh it — the X and
     * the hardware back gesture used to dismiss directly, which is why an adjustment only
     * showed up after reloading the parlay view.
     */
    function onPickCorrectionDone() {
        refreshParlay(parlay.id)
        dismissModal()
    }
    return (
        <AppModal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onPickCorrectionDone}
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
                        <Text style={{ ...typography.title, color: colors.textPrimary }}>{locking ? "Parlay Slip" : "Pick Adjustments"}</Text>
                        <Pressable onPress={onPickCorrectionDone} style={{ padding: spacing.xs }}>
                            <Text style={{ fontSize: 22, color: colors.textSecondary }}>x</Text>
                        </Pressable>
                    </View>
                    <ScrollView style={{ width: '100%' }}>
                        <ParlayPickCorrections
                            parlay={parlay}
                            onDone={onPickCorrectionDone}
                            onSubmitted={onSubmitted}
                            locking={locking}
                        />
                    </ScrollView>
                </View>
            </View>
        </AppModal>
    )
}
