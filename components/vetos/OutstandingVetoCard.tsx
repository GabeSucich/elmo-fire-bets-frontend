import { PickVetoResponseData } from "@/api"
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import React from "react"
import { Text, View } from "react-native"
import ActionButton from "../reusable/ActionButton"
import { colors, typography, spacing } from "@/theme/colors"

type PendingTransition = "editing-pick" | "locking-parlay"

type Props = {
    veto: PickVetoResponseData
    pendingTransition: PendingTransition
    onCancel: () => void
    onProceed: () => void
}

export default function OutstandingVetoCard({ veto, pendingTransition, onCancel, onProceed }: Props) {
    const { gamblers } = useGamblingSeasonContext()
    const ownerName = gamblers[veto.gambler_id]?.firstName ?? "Unknown"
    const affirmativeCount = veto.votes.filter(v => v.affirmative).length
    const nonAffirmativeCount = veto.votes.filter(v => !v.affirmative).length

    const approvalSingularPlural = `approval${affirmativeCount === 1 ? '' : 's'}`
    const rejectionSingularPlural = `rejection${nonAffirmativeCount === 1 ? '' : 's'}`

    const voteSummary = (
        <>
            <Text style={{ fontWeight: 'bold', color: colors.success }}>{affirmativeCount} {approvalSingularPlural}</Text> and <Text style={{ fontWeight: 'bold', color: colors.danger }}>{nonAffirmativeCount} {rejectionSingularPlural}</Text>
        </>
    )

    const isEditing = pendingTransition === "editing-pick"

    return (
        <View style={{ alignItems: 'center' }}>
            <Text style={{
                ...typography.heading,
                color: colors.textPrimary,
                marginBottom: spacing.md,
                textAlign: 'center',
            }}>
                {isEditing ? "Confirm Veto Deletion" : "Outstanding Veto"}
            </Text>
            <Text style={{
                ...typography.body,
                color: colors.textSecondary,
                lineHeight: 22,
                marginBottom: spacing.xl,
                textAlign: 'center',
            }}>
                {isEditing
                    ? <>There is an active veto from {ownerName} with {voteSummary}. Updating this pick will delete that veto. Make sure that editing your pick is high integrity.</>
                    : <>There is an undecided veto from {ownerName} with {voteSummary}. Locking the parlay will leave this veto in an undecided state, and no more voting will be allowed.</>
                }
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.md }}>
                <ActionButton text="Cancel" onPress={onCancel} color={colors.buttonSecondary} />
                <ActionButton text={isEditing ? "Update pick" : "Lock parlay"} onPress={onProceed} />
            </View>
        </View>
    )
}
