// components/ParlayCard.tsx
import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { ParlayResponseData, PickResponseData, ParlayResult, ParlayState } from "@/api";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import GamblerParlaySlot from "../picks/GamblerParlaySlot";
import { useParlaysContext } from "@/contexts/parlaysContext";
import { TileSize } from "../reusable/tiles/common";
import { ParlayResultColors } from "@/util/pickResults";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import ParlayMoney from "./ParlayMoney";
import { money, netPerPerson } from "@/util/payout";
import DeleteParlayModal from "./modals/DeleteParlayModal";
import ParlayEditorModal from "./modals/ParlayEditorModal";
import { ACTION_ICON_SIZE, colors, shadows, typography, spacing } from "@/theme/colors";
import { slateTypeDisplay } from "./common";
import Collapsible from "../reusable/Collapsible";
import { slateDateShort } from "@/util/slateDate";

interface ParlayCardProps {
  parlay: ParlayResponseData;
  editable: boolean
  pickTileSize?: TileSize
  /**
   * The card's actions, supplied by the caller rather than imported here.
   *
   * ParlayCard used to import ParlayFooter directly, which closed a require cycle:
   * the footer reaches ParlayFinalization, which renders a card of its own. Injecting
   * it keeps this component presentational and the dependency one-directional.
   */
  footer?: React.ReactNode
  disableResultEditing?: boolean
}

export function ParlayCard({ parlay, editable, pickTileSize, footer, disableResultEditing }: ParlayCardProps) {
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  // Closed parlays open collapsed to just their header; everything else starts open.
  const [expanded, setExpanded] = useState(parlay.state !== ParlayState.CLOSED)
  const { sortedGamblers } = useGamblingSeasonContext()

  const {
    isStagedForSwap,
    handleSwapSelect,
    deleteParlay
  } = useParlaysContext()


  function findPick(gamblerId: number): PickResponseData | null {
    return parlay.picks.find(pick => pick.gambler_id === gamblerId) ?? null
  }

  function formattedDate() {
    // See util/slateDate: a bare date string read through `new Date` lands on the previous
    // evening in Pacific, so every lay used to show the day before the one it is played on.
    return slateDateShort(parlay.competition_date)
  }

  const isBuilding = parlay.state === ParlayState.BUILDING
  const bozoCost = netPerPerson(parlay)

  return (
    <View style={styles.card}>
      <View style={[styles.headerBlock, !expanded && styles.headerBlockCollapsed]}>
        <View style={styles.headerRow}>
        <Text style={styles.header} numberOfLines={1}>{ slateTypeDisplay(parlay.slate_type) }</Text>
        <View style={styles.headerActions}>
          {parlay.result && (
            <View style={{ backgroundColor: ParlayResultColors[parlay.result], paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 }}>
              <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '600' }}>{parlay.result}</Text>
            </View>
          )}
          {/* What the bozo cost on top of the stake: the return everybody else had earned
              and nobody collected — the same figure the loss ledger charges for it. Beside
              the verdict rather than in the money line, which keeps saying what a lost lay
              always says. Absent until a payout is recorded, since there is no honest
              number before that. */}
          {parlay.result === ParlayResult.BOZO && bozoCost !== null && (
            <View style={styles.bozoCost}>
              <Text style={styles.bozoCostText}>− {money(bozoCost)}</Text>
            </View>
          )}
          {/* Edit, swap and delete are all outline icons at one size: they sit together in
              a busy header, and mixing a text label with filled glyphs made them read as
              three unrelated controls. */}
          {editable && (
            <Pressable
              onPress={() => setEditModalVisible(true)}
              hitSlop={8}
              accessibilityLabel="Edit parlay"
            >
              <MaterialCommunityIcons name="square-edit-outline" size={ACTION_ICON_SIZE} color={colors.accent} />
            </Pressable>
          )}
          {isBuilding && (
            <Pressable
              onPress={() => handleSwapSelect(parlay.id)}
              hitSlop={8}
              accessibilityLabel="Swap parlay order"
            >
              <MaterialCommunityIcons
                name="swap-vertical-circle-outline"
                size={ACTION_ICON_SIZE}
                color={isStagedForSwap(parlay.id) ? colors.accentDark : colors.textSecondary}
              />
            </Pressable>
          )}
          {isBuilding && (
            <Pressable
              onPress={() => setDeleteModalVisible(true)}
              hitSlop={8}
              accessibilityLabel="Delete parlay"
            >
              <MaterialCommunityIcons name="delete-outline" size={ACTION_ICON_SIZE} color={colors.danger} />
            </Pressable>
          )}
          {/* The date doubles as the collapse control, so the caret sits with it rather
              than adding a separate affordance to an already busy row. */}
          <Pressable
            onPress={() => setExpanded(prev => !prev)}
            style={styles.dateToggle}
            hitSlop={8}
            accessibilityLabel={expanded ? "Collapse parlay" : "Expand parlay"}
          >
            <Text style={styles.headerDate}>({ formattedDate() })</Text>
            <MaterialCommunityIcons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
          </View>
        </View>
        {/* Under the title rather than beside it: the slate names are long enough that a
            figure sharing the line truncated "Thursday Night Football". Inside the block,
            so it sits above the rule that separates the header from the picks. */}
        <ParlayMoney parlay={parlay} />
      </View>

      <Collapsible expanded={expanded}>
          {
            sortedGamblers.map((gambler, index) => (
              <View key={String(gambler.id)}>
                {index > 0 && <View style={styles.gamblerDivider} />}
                <GamblerParlaySlot
                  pick={findPick(gambler.id)}
                  editable={editable}
                  gambler={gambler}
                  parlay={parlay}
                  pickTileSize={pickTileSize}
                  allowResultEditing={!disableResultEditing}
                />
              </View>
            ))
          }

          <View style={styles.footerDivider} />
          {footer}
      </Collapsible>

      <ParlayEditorModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        parlay={parlay}
      />
      <DeleteParlayModal
        visible={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onDelete={() => {
          setDeleteModalVisible(false)
          deleteParlay(parlay.id)
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    ...shadows.card,
  },
  // The rule and the spacing belong to the block rather than the title line, so the money
  // underneath sits inside the header instead of below its divider.
  headerBlock: {
    gap: 2,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  // Collapsed, the header is the whole card — a rule under it would divide it from nothing.
  headerBlockCollapsed: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  bozoCost: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  bozoCostText: {
    ...typography.small,
    color: colors.danger,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginLeft: "auto",
  },
  dateToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  header: {
    ...typography.heading,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  headerDate: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  gamblerDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
    opacity: 0.5,
  },
  footerDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginTop: spacing.md,
  },
  pick: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  direction: {
    ...typography.body,
    color: colors.textPrimary,
  },
  sauce: {
    ...typography.caption,
    color: colors.warning,
    fontWeight: "600",
  },
  result: {
    ...typography.caption,
    fontWeight: "600",
    marginLeft: "auto",
  },
});
