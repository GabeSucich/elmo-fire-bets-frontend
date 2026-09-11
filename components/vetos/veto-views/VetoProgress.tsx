import { PickVetoResponseData } from "@/api";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import React from "react";
import { Text, View } from "react-native";
import { colors, typography, spacing } from "@/theme/colors";

type Props = {
    veto: PickVetoResponseData
}

export default function VetoProgress({ veto }: Props) {
    const {
        gamblers
    } = useGamblingSeasonContext()

    const affirmativeGamblerNames = veto.votes.filter(v => v.affirmative).map(v => gamblers[v.gambler_id]!.firstName)
    const nonAffirmativeGamblerNames = veto.votes.filter(v => !v.affirmative).map(v => gamblers[v.gambler_id]!.firstName)


    return (
        <View style={{
            flexDirection: 'row',
            padding: spacing.md,
            backgroundColor: colors.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            marginTop: spacing.sm,
        }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ ...typography.caption, fontWeight: 'bold', color: colors.success, marginBottom: spacing.sm }}>Approvers</Text>
                {affirmativeGamblerNames.map(name => (
                    <Text key={name} style={{ ...typography.caption, color: colors.textPrimary, marginBottom: spacing.xs }}>{name}</Text>
                ))}
                {affirmativeGamblerNames.length === 0 && (
                    <Text style={{ ...typography.caption, color: colors.textMuted, fontStyle: 'italic' }}>None</Text>
                )}
            </View>
            <View style={{ width: 1, backgroundColor: colors.divider }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ ...typography.caption, fontWeight: 'bold', color: colors.danger, marginBottom: spacing.sm }}>Rejectors</Text>
                {nonAffirmativeGamblerNames.map(name => (
                    <Text key={name} style={{ ...typography.caption, color: colors.textPrimary, marginBottom: spacing.xs }}>{name}</Text>
                ))}
                {nonAffirmativeGamblerNames.length === 0 && (
                    <Text style={{ ...typography.caption, color: colors.textMuted, fontStyle: 'italic' }}>None</Text>
                )}
            </View>
        </View>
    )
}
