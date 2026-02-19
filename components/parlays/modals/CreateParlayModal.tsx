import React from "react";
import { View, Modal, Text, Pressable } from "react-native";
import OverlayLoader from "@/components/reusable/OverlayLoader";
import { ParlaysService } from "@/api";
import { ParlayEditArgs } from "../common";
import ParlayEditCard from "../ParlayEditCard";
import useApiActionState from "@/composables/useApiActionState";
import { useErrorLoadingStates } from "@/composables/useErrorLoadingStates";
import { useParlaysContext } from "@/contexts/parlaysContext";
import ErrorView from "@/components/reusable/ErrorView";

type CreateParlayModalProps = {
    visible: boolean
    onClose: () => void
    seasonId: number
}

export default function CreateParlayModal({ visible, onClose, seasonId }: CreateParlayModalProps) {
    const { setLoading, setError, error, loading } = useErrorLoadingStates()
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
        setError,
        "Error creating new parlay"
    )

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <View style={{ width: '90%', backgroundColor: 'white', borderRadius: 10, padding: 20 }}>
                    <Pressable onPress={onClose}>
                        <Text style={{ fontSize: 18 }}>✕</Text>
                    </Pressable>
                    <ParlayEditCard handleEdit={createParlay} />
                    {loading && <OverlayLoader />}
                </View>
                {
                    error && <ErrorView errorMsg={error}/>
                }
            </View>
        </Modal>
    )
}
