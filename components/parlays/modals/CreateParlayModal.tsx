import React from "react";
import { View, Text, Pressable } from "react-native";
import AppModal from "@/components/reusable/AppModal";
import OverlayLoader from "@/components/reusable/OverlayLoader";
import { ParlaysService } from "@/api";
import { ParlayEditArgs } from "../common";
import ParlayEditCard from "../ParlayEditCard";
import useApiActionState from "@/composables/useApiActionState";
import { useLoadingState } from "@/composables/useLoadingState";
import { useParlaysContext } from "@/contexts/parlaysContext";
import { colors, shadows, spacing, typography } from "@/theme/colors";

type CreateParlayModalProps = {
    visible: boolean
    onClose: () => void
    seasonId: number
}

export default function CreateParlayModal({ visible, onClose, seasonId }: CreateParlayModalProps) {
    const { setLoading, loading } = useLoadingState()
    const { refreshParlays } = useParlaysContext()

    const {
        execute: createParlay
    } = useApiActionState(
        (args: ParlayEditArgs) => ParlaysService.createParlay({
            gambling_season_id: seasonId,
            slate_type: args.slateType,
            competition_date: args.competitionDate,
            owner_id: args.ownerId,
            wager_pp: args.wagerPp
        }),
        () => {
            onClose()
            refreshParlays()
        },
        setLoading,
        "Error creating new parlay"
    )

    return (
        <AppModal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: colors.overlay,
            }}>
                <View style={{
                    width: '90%',
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: 20,
                    padding: spacing.xl,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    ...shadows.modal,
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                        <Text style={{ ...typography.title, color: colors.textPrimary }}>New Parlay</Text>
                        <Pressable onPress={onClose} style={{ padding: spacing.xs }}>
                            <Text style={{ fontSize: 22, color: colors.textSecondary }}>x</Text>
                        </Pressable>
                    </View>
                    <ParlayEditCard handleEdit={createParlay} />
                    {loading && <OverlayLoader />}
                </View>
            </View>
        </AppModal>
    )
}
