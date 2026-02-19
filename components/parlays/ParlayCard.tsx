// components/ParlayCard.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, Modal, Pressable } from "react-native";
import { ParlayResponseData, PropBetDirection, PickResult, PickResponseData, ParlaysService, ParlayResult, ParlayState } from "@/api";
import { Gambler, useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import GamblerParlaySlot from "../picks/GamblerParlaySlot";
import { useParlaysContext } from "@/contexts/parlaysContext";
import { ParlayEditArgs } from "./common";
import { setApiErrorMsg } from "@/util/error";
import ParlayEditCard from "./ParlayEditCard";
import ParlayFooter from "./ParlayFooter";
import { TileSize } from "../reusable/tiles/common";
import { ParlayResultColors } from "@/util/pickResults";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import DeleteParlayModal from "./modals/DeleteParlayModal";

interface ParlayCardProps {
  parlay: ParlayResponseData;
  editable: boolean
  pickTileSize?: TileSize
  hideFooter?: boolean
  disableResultEditing?: boolean
}

export function ParlayCard({ parlay, editable, pickTileSize, hideFooter, disableResultEditing }: ParlayCardProps) {
  const [error, setError] = useState<string | null>("")
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const {
    gamblers,
    sortedGamblers
  } = useGamblingSeasonContext()

  const {
    refreshParlay,
    refreshParlays,
    isStagedForSwap,
    handleSwapSelect
  } = useParlaysContext()

  function findPick(gamblerId: number): PickResponseData | null {
    return parlay.picks.find(pick => pick.gambler_id === gamblerId) ?? null
  }

  const getResultColor = (result: ParlayResult) => {
    switch (result) {
      
    }
    if (!result) return "#666";
    if (result === ParlayResult.WIN) return "#34C759";
    if (result === ParlayResult.LOSS) return "#FF3B30";

    return "#FF9500";
  };

  function formattedDate() {
    const date = new Date(parlay.competition_date)
    const dayStr = date.getDate().toString().padStart(2, '0')
    const monthStr = (date.getMonth() + 1).toString().padStart(2, '0')
    return `${monthStr}/${dayStr}`
  }

  const isBuilding = parlay.state === ParlayState.BUILDING

  function deleteParlay() {
    setError(null)
    ParlaysService.deleteParlay(parlay.id)
    .then(res => refreshParlays())
    .catch(e => setApiErrorMsg(e, setError, "There was an error deleting the parlay!"))
  }

  function updateParlay(editArgs: ParlayEditArgs) {
    setError(null)
    const differentDate = editArgs.competitionDate !== parlay.competition_date
    const differentSlateType = editArgs.slateType !== parlay.slate_type
    const differentOwner = editArgs.ownerId !== parlay.owner_id
    const differentWager = editArgs.wagerPp !== parlay.wager_pp
    ParlaysService.updateParlay({
      parlay_id: parlay.id,
      competition_date: differentDate ? editArgs.competitionDate : null,
      owner_id: differentOwner ? editArgs.ownerId : null,
      slate_type: differentSlateType ? editArgs.slateType : null,
      wager_pp: differentWager ? editArgs.wagerPp : null
    }).then(res => {
      setEditModalVisible(false)
      refreshParlay(parlay.id)
    }).catch(e => {

    })
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>{ formattedDate() }</Text>
        <View style={styles.slateButton}>
          <Text style={styles.slateText}>{parlay.slate_type}</Text>
        </View>
        {parlay.result && (
          <View style={{ backgroundColor: ParlayResultColors[parlay.result], paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, marginLeft: 'auto' }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>{parlay.result}</Text>
          </View>
        )}
        {
          editable &&
          <Pressable onPress={() => setEditModalVisible(true)} style={{ ...(!parlay.result && { marginLeft: 'auto' }) }}>
            <Text style={{ color: '#007AFF', fontSize: 12, fontWeight: '500' }}>Edit</Text>
          </Pressable>
        }
        {isBuilding && (
          <Pressable onPress={() => handleSwapSelect(parlay.id)}>
            <MaterialCommunityIcons name="swap-vertical-circle" size={22} color={isStagedForSwap(parlay.id) ? '#16a34a' : 'black'} />
          </Pressable>
        )}
        {isBuilding && (
          <Pressable onPress={() => setDeleteModalVisible(true)}>
            <MaterialCommunityIcons name="delete" size={20} color="#dc2626" />
          </Pressable>
        )}
      </View>

      {
        sortedGamblers.map((gambler) => (
          <GamblerParlaySlot
            pick={findPick(gambler.id)}
            editable={editable}
            gambler={gambler}
            parlay={parlay}
            key={String(gambler.id)}
            pickTileSize={pickTileSize}
            allowResultEditing={!disableResultEditing}
          />
        ))
      }
      
      <View style={{ height: 1, backgroundColor: '#e0e0e0', marginTop: 8 }} />
      {!hideFooter && <ParlayFooter parlay={parlay}/>}

      <ParlayEditorModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        parlay={parlay}
        handleEdit={updateParlay}
      />
      <DeleteParlayModal
        visible={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onDelete={() => {
          setDeleteModalVisible(false)
          deleteParlay()
        }}
      />
    </View>
  );
}

type ParlayEditorModalProps = {
  visible: boolean
  onClose: () => void
  parlay: ParlayResponseData
  handleEdit: (args: ParlayEditArgs) => void
}

function ParlayEditorModal({ visible, onClose, parlay, handleEdit }: ParlayEditorModalProps) {
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
            handleEdit={handleEdit}
          />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  header: {
    fontSize: 16,
    fontWeight: "600",
  },
  slateButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  slateText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  pick: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  direction: {
    fontSize: 14,
    color: "#333",
  },
  sauce: {
    fontSize: 12,
    color: "#FF9500",
    fontWeight: "500",
  },
  result: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: "auto",
  },
});