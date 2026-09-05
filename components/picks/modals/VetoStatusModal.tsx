import { PickResponseData, PickVetoResponseData } from "@/api"
import { Pressable, Text, View } from "react-native"
import AppModal from "@/components/reusable/AppModal"
import VetoStatusCard from "../../vetos/VetoStatusCard"
import { colors, shadows, spacing, typography } from "@/theme/colors"

type Props = {
    visible: boolean
    onClose: () => void
    pick: PickResponseData
    veto: PickVetoResponseData
    onVoteSubmitted: () => void
    onVetoDeleted: () => void
}

export default function VetoStatusModal({ visible, onClose, pick, veto, onVetoDeleted, onVoteSubmitted }: Props) {
    return (
        <AppModal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: colors.overlay,
            }}>
                <View style={{
                    width: '90%',
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: 20,
                    padding: spacing.xl,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    ...shadows.modal,
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                        <Text style={{ ...typography.title, color: colors.textPrimary }}>Veto Status</Text>
                        <Pressable onPress={onClose} style={{ padding: spacing.xs }}>
                            <Text style={{ fontSize: 22, color: colors.textSecondary }}>x</Text>
                        </Pressable>
                    </View>
                    <VetoStatusCard
                        pick={pick}
                        veto={veto}
                        gamblerId={veto.gambler_id}
                        onDeleteVeto={onVetoDeleted}
                        onSubmitVote={onVoteSubmitted}
                    />
                </View>
            </View>
        </AppModal>
    )
}
