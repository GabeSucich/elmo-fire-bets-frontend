import { PickResponseData, VetoesService } from "@/api";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import React from "react";
import { Pressable, Text, View } from "react-native";
import PickDisplay from "../picks/PickDisplay";
import { useLoadingState } from "@/composables/useLoadingState";
import useApiActionState from "@/composables/useApiActionState";
import OverlayLoader from "../reusable/OverlayLoader";
import { colors, shadows, typography, spacing } from "@/theme/colors";

type Props = {
    pick: PickResponseData
    onVetoCreated: (vetoId: number) => void
}

export default function CreateVetoCard(props: Props) {
    const {
        gamblerId,
        gamblers
    } = useGamblingSeasonContext()

    const {
        loading, setLoading
    } = useLoadingState()

    const vetoMessage = () => {
        return `Are you sure you want to veto ${gamblers[props.pick.gambler_id].firstName}'s pick?`
    }

    const {
        execute: createVeto
    } = useApiActionState(
        () => VetoesService.createPickVeto({
            pick_id: props.pick.id,
            gambler_id: gamblerId
        }),
        res => props.onVetoCreated(res.veto.id),
        setLoading,
        "Error saving your veto"
    )


    return (
        <View style={{ alignItems: 'center', padding: spacing.sm }}>
            {loading && <OverlayLoader />}
            <Text style={{
                ...typography.heading,
                color: colors.textPrimary,
                textAlign: 'center',
                marginBottom: spacing.lg,
            }}>
                {vetoMessage()}
            </Text>
            <PickDisplay pick={props.pick} showVeto={false}/>
            <Pressable
                onPress={createVeto}
                disabled={loading}
                style={{
                    backgroundColor: loading ? colors.buttonDisabled : colors.danger,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.xxl,
                    borderRadius: 12,
                    marginTop: spacing.xl,
                    ...shadows.card,
                }}
            >
                <Text style={{
                    color: colors.textPrimary,
                    fontWeight: 'bold',
                    ...typography.heading,
                }}>
                    Veto
                </Text>
            </Pressable>
        </View>
    )
}
