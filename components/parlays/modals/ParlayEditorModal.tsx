import React from "react";
import { View, Text, Modal, Pressable } from "react-native";
import { ParlayResponseData, ParlaysService, UpdateParlayRequestData } from "@/api";
import { useParlaysContext } from "@/contexts/parlaysContext";
import { ParlayEditArgs } from "../common";
import ParlayEditCard from "../ParlayEditCard";
import useApiActionState from "@/composables/useApiActionState";
import { useErrorLoadingStates } from "@/composables/useErrorLoadingStates";

type ParlayEditorModalProps = {
  visible: boolean
  onClose: () => void
  parlay: ParlayResponseData
}

export default function ParlayEditorModal({ visible, onClose, parlay }: ParlayEditorModalProps) {
  const { setLoading, setError, error, loading } = useErrorLoadingStates()
  const { updateParlay } = useParlaysContext()

  function handleSubmit(editArgs: ParlayEditArgs) {
    const differentDate = editArgs.competitionDate !== parlay.competition_date
    const differentSlateType = editArgs.slateType !== parlay.slate_type
    const differentOwner = editArgs.ownerId !== parlay.owner_id
    const differentWager = editArgs.wagerPp !== parlay.wager_pp
    const request: UpdateParlayRequestData = {
      parlay_id: parlay.id,
      competition_date: differentDate ? editArgs.competitionDate : null,
      owner_id: differentOwner ? editArgs.ownerId : null,
      slate_type: differentSlateType ? editArgs.slateType : null,
      wager_pp: differentWager ? editArgs.wagerPp : null
    }
    return updateParlay(request)
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ width: '90%', backgroundColor: 'white', borderRadius: 10, padding: 20 }}>
          <Pressable onPress={onClose}>
            <Text style={{ fontSize: 18 }}>✕</Text>
          </Pressable>
          <ParlayEditCard
            parlay={parlay}
            handleEdit={(editArgs) => {
              handleSubmit(editArgs)
              onClose()
            }}
          />
        </View>
      </View>
    </Modal>
  )
}
