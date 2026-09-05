import { PickResponseData } from "@/api"
import { Pressable, Text, View } from "react-native"
import AppModal from "@/components/reusable/AppModal"
import GamblerPickEditor from "../GamblerPickEditor"
import { colors, shadows, spacing, typography } from "@/theme/colors"

type Props = {
    visible: boolean
    onClose: () => void
    pick: PickResponseData | null
    onPickSaved: () => void
    parlayId: number
    gamblerId: number
}

export default function PickEditorModal({ visible, onClose, pick, onPickSaved, parlayId, gamblerId }: Props) {
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
                        <Text style={{ ...typography.title, color: colors.textPrimary }}>
                            {pick ? 'Edit Pick' : 'New Pick'}
                        </Text>
                        <Pressable onPress={onClose} style={{ padding: spacing.xs }}>
                            <Text style={{ fontSize: 22, color: colors.textSecondary }}>x</Text>
                        </Pressable>
                    </View>
                    {
                        <GamblerPickEditor
                            pick={pick}
                            onPickSaved={onPickSaved}
                            parlayId={parlayId}
                            gamblerId={gamblerId}
                        />
                    }
                </View>
            </View>
        </AppModal>
    )
}
