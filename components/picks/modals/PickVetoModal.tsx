import { PickResponseData } from "@/api"
import { Pressable, Text, View } from "react-native"
import AppModal from "@/components/reusable/AppModal"
import CreateVetoCard from "../../vetos/CreateVetoCard"
import { colors, shadows, spacing, typography } from "@/theme/colors"

type Props = {
    visible: boolean
    onClose: () => void
    pick: PickResponseData
    onVetoCreated: () => void
}

export default function PickVetoModal({ visible, onClose, pick, onVetoCreated }: Props) {
    return (
        <AppModal
            visible={visible}
            animationType="slide"
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
                    padding: spacing.lg,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    ...shadows.modal,
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                        <Text style={{ ...typography.title, color: colors.textPrimary }}>Veto</Text>
                        <Pressable onPress={onClose} style={{ padding: spacing.xs }}>
                            <Text style={{ fontSize: 22, color: colors.textSecondary }}>x</Text>
                        </Pressable>
                    </View>
                    <CreateVetoCard
                        pick={pick}
                        onVetoCreated={onVetoCreated}
                    />
                </View>
            </View>
        </AppModal>
    )
}
