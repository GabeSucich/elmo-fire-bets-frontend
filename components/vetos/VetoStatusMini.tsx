import { PickVetoResponseData, VetoApprovalStatus } from "@/api";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import React from "react";
import { View, Text } from "react-native";

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
                <View style={{ backgroundColor: '#e5e5e5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                    <Text style={{ color: '#666', textAlign: 'center' }}>
                        {vetoingGamblerName} veto
                    </Text>
                </View>
                {affirmativeVotes > 0 && (
                    <View style={{ backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginLeft: 6 }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 11 }}>
                            +{affirmativeVotes}
                        </Text>
                    </View>
                )}
                {nonAffirmativeVotes > 0 && (
                    <View style={{ backgroundColor: '#dc2626', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, marginLeft: 6 }}>
                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 11 }}>
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

    return (
        <View style={{ backgroundColor: '#FF8D8D', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
            <Text style={{ color: 'white', textAlign: 'center', fontSize: 11 }}>
                {vetoingGamblerName} veto 🔒
            </Text>
        </View>
    )
}
