import { PickResponseData, PickVetoResponseData, PropBetDirection, VetoApprovalStatus } from "@/api";
import React from "react";
import { Text, View } from "react-native";
import EntypoIcon from "react-native-vector-icons/Entypo"
import PickTargetTile from "@/components/picks/tiles/PickTargetTile";
import PickLineTile from "@/components/picks/tiles/PickLineTile";
import PickBetTypeTile from "@/components/picks/tiles/PickBetTypeTile";
import { colors, typography, spacing } from "@/theme/colors";

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
        <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
            <Text style={{ textAlign: 'center', color: colors.textSecondary, ...typography.body }}>
                {isApproved
                    ? `${vetoerName} has vetoed ${vetoeeName}'s pick:`
                    : `${vetoerName} is proposing to veto ${vetoeeName}'s pick:`}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm }}>
                <View style={{ alignItems: 'center', marginRight: spacing.md, gap: spacing.sm }}>
                    <PickTargetTile pick={pick} />
                    <PickBetTypeTile pick={pick} />
                </View>
                <View style={{ alignItems: 'center', gap: spacing.xs }}>
                    <PickLineTile pick={pick} showVeto={false} />
                    <EntypoIcon name="arrow-long-down" color={colors.textSecondary} />
                    <PickLineTile pick={{...pick, direction: flippedDirection}} />
                </View>
            </View>
        </View>
    )
}
