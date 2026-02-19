import { PickResponseData, PickVetoResponseData, VetoApprovalStatus, VetoesService } from "@/api";
import React from "react";
import { Text, View } from "react-native";
import VetoProgress from "./VetoProgress";
import ActionButton from "../../reusable/ActionButton";
import PickDisplay from "@/components/picks/PickDisplay";
import VetoPickDisplay from "./VetoPickDisplay";
import { useErrorLoadingStates } from "@/composables/useErrorLoadingStates";
import useApiActionState from "@/composables/useApiActionState";
import OverlayLoader from "../../reusable/OverlayLoader";

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
        error, setError, loading, setLoading
    } = useErrorLoadingStates()

    const {
        execute: deleteVeto
    }= useApiActionState(
        () => VetoesService.deleteVeto(veto.id),
        res => props.onDelete ? props.onDelete() : {},
        setLoading,
        setError,
        "Error deleting your veto!"
    )

    if (status === VetoApprovalStatus.APPROVED || status === VetoApprovalStatus.REJECTED) {
        return null
    }

    if (status === VetoApprovalStatus.UNDECIDED) {
        return (
            <View style={{ padding: 12 }}>
                <Text style={{ fontSize: 14, color: '#333', textAlign: 'center' }}>
                    The parlay was locked before a decision could be made on this veto. It will not take effect on the parlay.
                </Text>
                <PickDisplay pick={props.pick} size="sm"/>
            </View>
        )
    }

    if (status === VetoApprovalStatus.PENDING) {
        return (
            <View style={{ padding: 12 }}>
                {loading && <OverlayLoader />}
                <Text style={{ fontSize: 14, color: '#333', textAlign: 'center', marginBottom: 12 }}>
                    Your veto of {vetoeeName}'s pick is currently open to voting.
                </Text>
                <VetoPickDisplay pick={props.pick} veto={props.veto} vetoeeName={vetoeeName} vetoerName={vetoerName}/>
                <VetoProgress
                    veto={veto}
                />
                {onDelete && (
                    <View style={{ alignSelf: 'center', marginTop: 16 }}>
                        <ActionButton text="Delete Veto" onPress={deleteVeto} color="#dc2626" />
                    </View>
                )}
            </View>
        )
    }

    return null
}
