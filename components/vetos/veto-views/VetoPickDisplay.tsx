import { PickResponseData, PickVetoResponseData, PropBetDirection, VetoApprovalStatus } from "@/api";
import React from "react";
import { Text, View } from "react-native";
import EntypoIcon from "react-native-vector-icons/Entypo"
import PickTargetTile from "@/components/picks/tiles/PickTargetTile";
import PickLineTile from "@/components/picks/tiles/PickLineTile";
import PickBetTypeTile from "@/components/picks/tiles/PickBetTypeTile";

type Props = {
    pick: PickResponseData
    veto: PickVetoResponseData
    vetoerName: string
    vetoeeName: string
}

export default function VetoPickDisplay({pick, vetoeeName, vetoerName, veto}: Props) {
    const isApproved = veto.approval_status === VetoApprovalStatus.APPROVED

    const flippedDirection = pick.direction === PropBetDirection.OVER ? PropBetDirection.UNDER : PropBetDirection.OVER

    return (
        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
            <Text style={{ textAlign: 'center' }}>
                {isApproved
                    ? `${vetoerName} has vetoed ${vetoeeName}'s pick:`
                    : `${vetoerName} is proposing to veto ${vetoeeName}'s pick:`}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
                <View style={{ alignItems: 'center', marginRight: 12, gap: 8 }}>
                    <PickTargetTile pick={pick} />
                    <PickBetTypeTile pick={pick} />
                </View>
                <View style={{ alignItems: 'center', gap: 4 }}>
                    <PickLineTile pick={pick} showVeto={false} />
                    <EntypoIcon name="arrow-long-down" color={"black"} />
                    <PickLineTile pick={{...pick, direction: flippedDirection}} />
                </View>
            </View>
        </View>
    )
}