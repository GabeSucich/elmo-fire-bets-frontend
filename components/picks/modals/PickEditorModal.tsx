import { PickResponseData } from "@/api"
import { Pressable, Text, View } from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import AppModal from "@/components/reusable/AppModal"
import GamblerPickEditor from "../GamblerPickEditor"
import { PickPrefill } from "../PickEditor"
import { colors, shadows, spacing, typography } from "@/theme/colors"

type Props = {
    visible: boolean
    onClose: () => void
    pick: PickResponseData | null
    prefill?: PickPrefill | null
    onPickSaved: () => void
    parlayId: number
    gamblerId: number
    /**
     * Leaves the editor for the line browser. Optional: a caller with no browser to offer
     * simply does not get the button.
     */
    onBrowseLines?: () => void
    /**
     * Fired once this modal has actually finished dismissing, so whatever replaces it can
     * wait for the screen to be free — iOS will not present over a modal that is still
     * going away, and says nothing when it declines.
     */
    onDismissed?: () => void
}

export default function PickEditorModal({
    visible, onClose, pick, prefill, onPickSaved, parlayId, gamblerId, onBrowseLines, onDismissed,
}: Props) {
    return (
        <AppModal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
            onDismiss={onDismissed}
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
                        <Text style={{ ...typography.title, color: colors.textPrimary, flexShrink: 1 }}>
                            {pick ? 'Edit Pick' : 'New Pick'}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                            {/* Beside the close rather than down with the form: it swaps
                                what you are looking at, which is a thing you do to the
                                dialog and not a step within it. On an edit this is the way
                                to replace the bet with one off the board. */}
                            {onBrowseLines && (
                                <Pressable
                                    onPress={onBrowseLines}
                                    hitSlop={6}
                                    style={({ pressed }) => ({
                                        flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
                                        paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
                                        borderRadius: 8, borderWidth: 1, borderColor: colors.cardBorder,
                                        backgroundColor: pressed ? colors.inputBackground : 'transparent',
                                    })}
                                >
                                    <MaterialCommunityIcons name="magnify" size={14} color={colors.accent} />
                                    <Text style={{ ...typography.small, color: colors.accent, fontWeight: '600' }}>
                                        Browse lines
                                    </Text>
                                </Pressable>
                            )}
                            <Pressable onPress={onClose} style={{ padding: spacing.xs }}>
                                <Text style={{ fontSize: 22, color: colors.textSecondary }}>x</Text>
                            </Pressable>
                        </View>
                    </View>
                    {
                        <GamblerPickEditor
                            pick={pick}
                            prefill={prefill}
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
