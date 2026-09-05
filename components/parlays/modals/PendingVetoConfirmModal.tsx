import OutstandingVetoCard from "@/components/vetos/OutstandingVetoCard"
import { View } from "react-native"
import AppModal from "@/components/reusable/AppModal"
import { colors, shadows, spacing } from "@/theme/colors"

type Props = {
    visible: boolean
    veto: import("@/api").PickVetoResponseData
    onCancel: () => void
    onProceed: () => void
}

export default function PendingVetoConfirmModal({ visible, veto, onCancel, onProceed }: Props) {
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
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    ...shadows.modal,
                }}>
                    <OutstandingVetoCard
                        veto={veto}
                        pendingTransition="locking-parlay"
                        onCancel={onCancel}
                        onProceed={onProceed}
                    />
                </View>
            </View>
        </AppModal>
    )
}
