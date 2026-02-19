import { PickVetoResponseData } from "@/api";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import React from "react";
import { Text, View } from "react-native";

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
        <View style={{ flexDirection: 'row', padding: 12 }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontWeight: 'bold', color: '#16a34a', marginBottom: 8 }}>Approvers</Text>
                {affirmativeGamblerNames.map(name => (
                    <Text key={name} style={{ fontSize: 13, color: '#333', marginBottom: 4 }}>{name}</Text>
                ))}
            </View>
            <View style={{ width: 1, backgroundColor: '#ccc' }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontWeight: 'bold', color: '#dc2626', marginBottom: 8 }}>Rejectors</Text>
                {nonAffirmativeGamblerNames.map(name => (
                    <Text key={name} style={{ fontSize: 13, color: '#333', marginBottom: 4 }}>{name}</Text>
                ))}
            </View>
        </View>
    )
}
