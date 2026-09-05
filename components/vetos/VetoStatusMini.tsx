import { PickVetoResponseData, VetoApprovalStatus } from "@/api";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import React from "react";
import { View, Text } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { colors, typography, spacing } from "@/theme/colors";

type Props = {
    veto: PickVetoResponseData
}

export default function VetoStatusMini(props: Props) {
    const {
        gamblers
    } = useGamblingSeasonContext()

    const vetoingGamblerName = gamblers[props.veto.gambler_id].firstName
    const isPending = props.veto.approval_status === VetoApprovalStatus.PENDING
    const isUndecided = props.veto.approval_status === VetoApprovalStatus.UNDECIDED

    const affirmativeVotes = props.veto.votes.filter(v => v.affirmative).length
    const nonAffirmativeVotes = props.veto.votes.filter(v => !v.affirmative).length

    if (isPending) {
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.sm,
                    borderRadius: 8,
                }}>
                    <Text style={{ color: colors.textSecondary, textAlign: 'center', ...typography.caption }}>
                        {vetoingGamblerName} veto ⏳
                    </Text>
                </View>
                {affirmativeVotes > 0 && (
                    <View style={{
                        backgroundColor: colors.success,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.xs,
                        borderRadius: 10,
                        marginLeft: spacing.xs,
                    }}>
                        <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 11 }}>
                            +{affirmativeVotes}
                        </Text>
                    </View>
                )}
                {nonAffirmativeVotes > 0 && (
                    <View style={{
                        backgroundColor: colors.danger,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.xs,
                        borderRadius: 10,
                        marginLeft: spacing.xs,
                    }}>
                        <Text style={{ color: colors.textPrimary, fontWeight: 'bold', fontSize: 11 }}>
                            -{nonAffirmativeVotes}
                        </Text>
                    </View>
                )}
            </View>
        )
    }

    if (isUndecided) {
        return null
    }

    // An approved veto is a fact about the pick, not an alarm — the glyph carries the
    // meaning, so it does not need a filled red block behind it as well.
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <MaterialCommunityIcons name="cancel" size={15} color={colors.danger} />
            <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '600' }}>
                {vetoingGamblerName}
            </Text>
        </View>
    )
}
