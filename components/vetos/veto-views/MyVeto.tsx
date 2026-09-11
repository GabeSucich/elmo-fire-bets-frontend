import { PickResponseData, PickVetoResponseData, VetoApprovalStatus, VetoesService } from "@/api";
import React from "react";
import { Text, View } from "react-native";
import VetoProgress from "./VetoProgress";
import ActionButton from "../../reusable/ActionButton";
import PickDisplay from "@/components/picks/PickDisplay";
import VetoPickDisplay from "./VetoPickDisplay";
import { useLoadingState } from "@/composables/useLoadingState";
import useApiActionState from "@/composables/useApiActionState";
import OverlayLoader from "../../reusable/OverlayLoader";
import { colors, typography, spacing } from "@/theme/colors";

type Props = {
    pick: PickResponseData
    veto: PickVetoResponseData
    vetoeeName: string
    vetoerName: string
    onDelete?: () => void
}

export default function MyVeto(props: Props) {
    const { veto, vetoeeName, vetoerName, onDelete } = props
    const status = veto.approval_status

    const {
        loading, setLoading
    } = useLoadingState()

    const {
        execute: deleteVeto
    }= useApiActionState(
        () => VetoesService.deleteVeto(veto.id),
        res => props.onDelete ? props.onDelete() : {},
        setLoading,
        "Error deleting your veto!"
    )

    if (status === VetoApprovalStatus.APPROVED || status === VetoApprovalStatus.REJECTED) {
        return null
    }

    if (status === VetoApprovalStatus.UNDECIDED) {
        return (
            <View style={{ padding: spacing.md }}>
                <Text style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center' }}>
                    The parlay was locked before a decision could be made on this veto. It will not take effect on the parlay.
                </Text>
                <PickDisplay pick={props.pick} size="sm"/>
            </View>
        )
    }

    if (status === VetoApprovalStatus.PENDING) {
        return (
            <View style={{ padding: spacing.md }}>
                {loading && <OverlayLoader />}
                <Text style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md }}>
                    Your veto of {vetoeeName}’s pick is currently open to voting.
                </Text>
                <VetoPickDisplay pick={props.pick} veto={props.veto} vetoeeName={vetoeeName} vetoerName={vetoerName}/>
                <VetoProgress
                    veto={veto}
                />
                {onDelete && (
                    <View style={{ alignSelf: 'center', marginTop: spacing.lg }}>
                        <ActionButton text="Delete Veto" onPress={deleteVeto} color={colors.danger} />
                    </View>
                )}
            </View>
        )
    }

    return null
}
