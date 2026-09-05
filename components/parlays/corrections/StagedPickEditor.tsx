import { PickResponseData } from "@/api"
import { PickCreateEditData } from "@/components/picks/common"
import { ReviewRowState } from "@/composables/useCorrectionImageAnalysis"
import { colors, spacing, typography } from "@/theme/colors"
import { Text, View } from "react-native"
import ActionButton from "../../reusable/ActionButton"
import PickEditor from "../../picks/PickEditor"

type Props = {
    row: ReviewRowState
    onStage: (data: PickCreateEditData) => void
    onCancel: () => void
}

/**
 * The full pick editor, wired to stage rather than save.
 *
 * Nothing here touches the API. The edit is handed back to the review list and written with
 * everyone else's on submit, so a correction made this way can still be revised or abandoned.
 */
export default function StagedPickEditor({ row, onStage, onCancel }: Props) {
    // Reopening after an edit should show what was staged, not the stored pick.
    const pick: PickResponseData = row.edit
        ? {
            ...row.pick,
            prop_type: row.edit.propType,
            direction: row.edit.direction,
            sauce_factor: row.edit.sauceFactor,
            corrected_line: parseFloat(row.value),
            prop_bet_target: {
                ...row.pick.prop_bet_target,
                identifier: row.edit.playerTeamResult.identifier,
                player_name: row.edit.playerTeamResult.playerName,
                team_name: row.edit.playerTeamResult.teamName,
            },
        }
        : row.pick

    return (
        <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: spacing.sm }}>
                <ActionButton text="Back" onPress={onCancel} color={colors.buttonSecondary} />
                <Text style={{ ...typography.caption, color: colors.textSecondary, fontStyle: 'italic' }}>
                    Saved with the rest on submit
                </Text>
            </View>
            <Text style={{
                ...typography.heading,
                fontStyle: 'italic',
                textAlign: 'center',
                color: colors.textPrimary,
                marginBottom: spacing.sm,
            }}>Editing {row.gamblerName}'s pick</Text>
            <PickEditor
                pick={pick}
                handleEdit={onStage}
                showDeleteVetoOption={true}
                allowInPlaceCorrection={true}
                submitLabel="Use this pick"
            />
        </View>
    )
}
