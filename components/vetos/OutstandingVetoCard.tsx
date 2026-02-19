import { PickVetoResponseData } from "@/api"
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import React from "react"
import { Text, View } from "react-native"
import ActionButton from "../reusable/ActionButton"

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
            <Text style={{ fontWeight: 'bold', color: '#166534' }}>{affirmativeCount} {approvalSingularPlural}</Text> and <Text style={{ fontWeight: 'bold', color: '#991b1b' }}>{nonAffirmativeCount} {rejectionSingularPlural}</Text>
        </>
    )

    const isEditing = pendingTransition === "editing-pick"

    return (
        <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, textAlign: 'center' }}>
                {isEditing ? "Confirm Veto Deletion" : "Outstanding Veto"}
            </Text>
            <Text style={{ fontSize: 14, color: '#333', lineHeight: 20, marginBottom: 20, textAlign: 'center' }}>
                {isEditing
                    ? <>There is an active veto from {ownerName} with {voteSummary}. Updating this pick will delete that veto. Make sure that editing your pick is high integrity.</>
                    : <>There is an undecided veto from {ownerName} with {voteSummary}. Locking the parlay will leave this veto in an undecided state, and no more voting will be allowed.</>
                }
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
                <ActionButton text="Cancel" onPress={onCancel} color="#e0e0e0" />
                <ActionButton text={isEditing ? "Update pick" : "Lock parlay"} onPress={onProceed} />
            </View>
        </View>
    )
}
