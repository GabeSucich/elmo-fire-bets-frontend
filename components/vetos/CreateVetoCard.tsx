import { PickResponseData, VetoesService } from "@/api";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import { setApiErrorMsg } from "@/util/error";
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import PickDisplay from "../picks/PickDisplay";

type Props = {
    pick: PickResponseData
    onVetoCreated: (vetoId: number) => void
}

export default function CreateVetoCard(props: Props) {
    const {
        gamblerId,
        gamblers
    } = useGamblingSeasonContext()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const vetoMessage = () => {
        return `Are you sure you want to veto ${gamblers[props.pick.gambler_id].firstName}'s pick?`
    }

    function createVeto() {
        setLoading(true)
        setError(null)
        VetoesService.createPickVeto({
            pick_id: props.pick.id,
            gambler_id: gamblerId
        }).then(res => {
            props.onVetoCreated(res.veto.id)
        }).catch(e => setApiErrorMsg(e, setError, "There was an error creating the veto"))
        .finally(() => setLoading(false))
    }

    return (
        <View style={{ alignItems: 'center', padding: 0 }}>
            <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 16 }}>
                {vetoMessage()}
            </Text>
            <PickDisplay pick={props.pick} showVeto={false}/>
            <Pressable
                onPress={createVeto}
                disabled={loading}
                style={{
                    backgroundColor: loading ? '#ccc' : '#dc2626',
                    paddingVertical: 12,
                    paddingHorizontal: 32,
                    borderRadius: 8,
                    marginTop: 20
                }}
            >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                    {loading ? 'Vetoing...' : 'Veto'}
                </Text>
            </Pressable>
            {error && (
                <Text style={{ color: 'red', marginTop: 12, textAlign: 'center' }}>
                    {error}
                </Text>
            )}
        </View>
    )
}