import React from "react";
import { View, Text, Pressable } from "react-native";
import AppModal from "@/components/reusable/AppModal";
import { ParlayResponseData, ParlaysService, UpdateParlayRequestData } from "@/api";
import { useParlaysContext } from "@/contexts/parlaysContext";
import { ParlayEditArgs } from "../common";
import ParlayEditCard from "../ParlayEditCard";
import { colors, shadows, spacing, typography } from "@/theme/colors";

type ParlayEditorModalProps = {
  visible: boolean
  onClose: () => void
  parlay: ParlayResponseData
}

export default function ParlayEditorModal({ visible, onClose, parlay }: ParlayEditorModalProps) {
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
    <AppModal
      visible={visible}
      animationType="slide"
      transparent={true}
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
            <Text style={{ ...typography.title, color: colors.textPrimary }}>Edit Parlay</Text>
            <Pressable onPress={onClose} style={{ padding: spacing.xs }}>
              <Text style={{ fontSize: 22, color: colors.textSecondary }}>x</Text>
            </Pressable>
          </View>
          <ParlayEditCard
            parlay={parlay}
            handleEdit={(editArgs) => {
              handleSubmit(editArgs)
              onClose()
            }}
          />
        </View>
      </View>
    </AppModal>
  )
}
