import { PickResponseData } from "@/api"
import { Pressable, Text, View } from "react-native"
import AppModal from "@/components/reusable/AppModal"
import PickResultEditor from "../PickResultEditor"
import { colors, shadows, spacing, typography } from "@/theme/colors"

type Props = {
    visible: boolean
    onClose: () => void
    pick: PickResponseData
    onUpdated: (pick: PickResponseData) => void
}

export default function PickResultEditorModal({ visible, onClose, pick, onUpdated }: Props) {
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
                    padding: spacing.xl,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    ...shadows.modal,
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                        <Text style={{ ...typography.title, color: colors.textPrimary }}>Pick result</Text>
                        <Pressable onPress={onClose} style={{ padding: spacing.xs }}>
                            <Text style={{ fontSize: 22, color: colors.textSecondary }}>x</Text>
                        </Pressable>
                    </View>
                    <PickResultEditor
                        pick={pick}
                        onUpdated={onUpdated}
                    />
                </View>
            </View>
        </AppModal>
    )
}
