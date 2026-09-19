import React, { useEffect, useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { PickListItemRequestData, PickListItemResponseData, PickListResponseData } from "@/api"
import ActivityLoader from "@/components/reusable/ActivityLoader"
import Collapsible from "@/components/reusable/Collapsible"
import OverlayLoader from "@/components/reusable/OverlayLoader"
import RefreshableScrollView from "@/components/reusable/RefreshableScrollView"
import TabButtons from "@/components/reusable/TabButtons"
import TeamLogo from "@/components/reusable/TeamLogo"
import PickListItemEditorModal from "@/components/pick-lists/PickListItemEditorModal"
import { useGamblersMeFirst } from "@/composables/useGamblersMeFirst"
import { usePickLists } from "@/composables/usePickLists"
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import { PICK_LIST_DISPLAY, describeNarrowing, entryTargetName, sortItems } from "@/util/pickLists"
import { colors, shadows, spacing, typography } from "@/theme/colors"

type Props = {
    seasonId: number
}

type GamblerCardProps = {
    name: string
    count: number
    children: React.ReactNode
}

/** One gambler's entries, collapsible so a five-person league stays scannable. Open by
 *  default, since reading the lists is the point of the tab. */
function GamblerCard({ name, count, children }: GamblerCardProps) {
    const [expanded, setExpanded] = useState(true)

    return (
        <View style={styles.card}>
            <Pressable style={styles.cardHeader} onPress={() => setExpanded(open => !open)}>
                <Text style={styles.gamblerName} numberOfLines={1}>{name}</Text>
                <Text style={styles.entryCount}>{count}</Text>
                <Ionicons
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.textSecondary}
                />
            </Pressable>
            <Collapsible expanded={expanded}>
                <View style={styles.cardBody}>{children}</View>
            </Collapsible>
        </View>
    )
}

/**
 * The season's lists — today the ban list, and laid out as though there were several.
 *
 * Everybody's entries, with the reader's first: the point of a ban list is that the rest
 * of the league can see it before they take the bet. Only your own rows carry controls,
 * because nobody else gets to decide who you have written off.
 */
export default function ListsView(props: Props) {
    const { gamblerId } = useGamblingSeasonContext()
    const lists = usePickLists(props.seasonId)
    const meFirst = useGamblersMeFirst()

    const [activeListId, setActiveListId] = useState<number | null>(null)
    const [editing, setEditing] = useState<{ item: PickListItemResponseData | null } | null>(null)
    // The row whose remove button has been pressed once. An entry is a sentence somebody
    // wrote rather than a toggle, and this app does not raise native alerts, so the
    // confirmation is the row itself asking again.
    const [confirmingRemoveId, setConfirmingRemoveId] = useState<number | null>(null)

    // The first list is selected on arrival, and the selection is left alone after that.
    useEffect(() => {
        if (activeListId === null && lists.lists.length > 0) {
            setActiveListId(lists.lists[0].id)
        }
    }, [lists.lists, activeListId])

    const activeList: PickListResponseData | null =
        lists.lists.find(l => l.id === activeListId) ?? lists.lists[0] ?? null

    const byGambler = useMemo(
        () => meFirst.map(g => ({
            gambler: g,
            items: sortItems((activeList?.items ?? []).filter(i => i.gambler_id === g.id)),
        })),
        [meFirst, activeList]
    )

    if (!lists.initialized) {
        return (
            <View style={styles.container}>
                <ActivityLoader text="Loading lists..." />
            </View>
        )
    }

    if (!activeList) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyScreen}>This season has no lists.</Text>
            </View>
        )
    }

    const display = PICK_LIST_DISPLAY[activeList.list_type]
    const canEdit = lists.editable

    return (
        <View style={styles.container}>
            <TabButtons<PickListResponseData>
                tabs={lists.lists}
                activeTab={activeList}
                setActiveTab={l => setActiveListId(l.id)}
                getKey={l => String(l.id)}
                getDisplay={l => (
                    <>
                        <MaterialCommunityIcons
                            name={PICK_LIST_DISPLAY[l.list_type].icon}
                            size={13}
                            color={PICK_LIST_DISPLAY[l.list_type].color}
                        />
                        {"  "}{l.display_name}
                    </>
                )}
                size="sm"
            />

            <Text style={styles.blurb}>
                A pick lands on the list when it matches an entry. Anything left as
                “any” matches everything — an entry on the over says nothing about an under.
            </Text>

            <RefreshableScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                onRefresh={lists.reload}
                refreshing={lists.loading}
            >
                {byGambler.map(({ gambler, items }) => {
                    const isMine = gambler.id === gamblerId
                    return (
                        <GamblerCard key={gambler.id} name={gambler.firstName} count={items.length}>
                            {items.length === 0 && (
                                <Text style={styles.fillerText}>
                                    {isMine ? "You have not banned anyone yet." : "Nothing on this list."}
                                </Text>
                            )}

                            {items.map(item => (
                                <View key={item.id} style={styles.entryRow}>
                                    {lists.pendingItemId === item.id && <OverlayLoader loaderProps={{ size: 20 }} />}
                                    <View style={styles.entryMain}>
                                        <View style={styles.entryTitleRow}>
                                            <TeamLogo team={item.prop_bet_target.team_name} size={18} />
                                            <Text style={styles.entryTarget} numberOfLines={1}>
                                                {entryTargetName(item)}
                                            </Text>
                                        </View>
                                        <Text style={styles.entryNarrowing}>{describeNarrowing(item)}</Text>
                                    </View>

                                    {isMine && canEdit && (
                                        confirmingRemoveId === item.id ? (
                                            <View style={styles.entryActions}>
                                                <Pressable
                                                    onPress={() => {
                                                        setConfirmingRemoveId(null)
                                                        lists.removeItem(item.id)
                                                    }}
                                                    style={[styles.actionChip, styles.actionChipDanger]}
                                                >
                                                    <Text style={styles.actionChipDangerText}>Remove</Text>
                                                </Pressable>
                                                <Pressable
                                                    onPress={() => setConfirmingRemoveId(null)}
                                                    style={styles.actionChip}
                                                >
                                                    <Text style={styles.actionChipText}>Cancel</Text>
                                                </Pressable>
                                            </View>
                                        ) : (
                                            <View style={styles.entryActions}>
                                                <Pressable
                                                    onPress={() => setEditing({ item })}
                                                    hitSlop={8}
                                                    accessibilityRole="button"
                                                    accessibilityLabel={`Edit ${entryTargetName(item)}`}
                                                >
                                                    <MaterialCommunityIcons
                                                        name="pencil" size={16} color={colors.accent}
                                                    />
                                                </Pressable>
                                                <Pressable
                                                    onPress={() => setConfirmingRemoveId(item.id)}
                                                    hitSlop={8}
                                                    accessibilityRole="button"
                                                    accessibilityLabel={`Remove ${entryTargetName(item)}`}
                                                >
                                                    <MaterialCommunityIcons
                                                        name="trash-can-outline" size={16} color={colors.textMuted}
                                                    />
                                                </Pressable>
                                            </View>
                                        )
                                    )}
                                </View>
                            ))}

                            {isMine && canEdit && (
                                <View style={styles.cardFooter}>
                                    <Pressable
                                        onPress={() => setEditing({ item: null })}
                                        style={[styles.addButton, { borderColor: display.color }]}
                                    >
                                        <Text style={styles.addButtonText}>+ Add to {activeList.display_name}</Text>
                                    </Pressable>
                                </View>
                            )}
                        </GamblerCard>
                    )
                })}

                {!canEdit && (
                    <Text style={styles.fillerText}>This season is complete — lists are read-only.</Text>
                )}
            </RefreshableScrollView>

            {/* The editor closes as soon as a write lands while the list is still being
                re-fetched behind it; without this the tab sits on stale rows with no sign
                that the new entry is on its way. */}
            {lists.loading && lists.initialized && <OverlayLoader />}

            <PickListItemEditorModal
                visible={editing !== null}
                listName={activeList.display_name}
                gamblerId={gamblerId}
                item={editing?.item ?? null}
                saving={lists.saving}
                onClose={() => setEditing(null)}
                onSubmit={(body: PickListItemRequestData) => {
                    // Closed by the callback rather than here, so a failed save keeps the
                    // form up with what was chosen in it.
                    const done = () => setEditing(null)
                    if (editing?.item) lists.saveItem(editing.item.id, body, done)
                    else lists.addItem(activeList.id, body, done)
                }}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    blurb: {
        ...typography.caption, color: colors.textMuted,
        paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
    },
    emptyScreen: {
        ...typography.body, color: colors.textMuted,
        textAlign: "center", marginTop: spacing.xl,
    },
    scrollArea: { flex: 1 },
    scrollContent: { padding: spacing.lg, gap: spacing.md },
    card: {
        backgroundColor: colors.card, borderRadius: 16, padding: spacing.lg,
        borderWidth: 1, borderColor: colors.cardBorder, gap: spacing.sm, ...shadows.card,
    },
    cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    cardBody: { gap: spacing.sm, paddingTop: spacing.sm },
    gamblerName: { ...typography.heading, color: colors.textPrimary, flex: 1 },
    entryCount: { ...typography.caption, color: colors.textMuted },
    cardFooter: { flexDirection: "row", justifyContent: "flex-end" },
    addButton: {
        paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
        borderRadius: 14, backgroundColor: colors.backgroundSecondary, borderWidth: 1,
    },
    addButtonText: { ...typography.caption, color: colors.textPrimary, fontWeight: "600" },
    fillerText: { ...typography.caption, color: colors.textMuted, fontStyle: "italic" },
    entryRow: {
        flexDirection: "row", alignItems: "center", gap: spacing.sm,
        paddingVertical: spacing.sm, paddingHorizontal: spacing.sm,
        backgroundColor: colors.backgroundSecondary, borderRadius: 10,
    },
    entryMain: { flex: 1, gap: 2 },
    entryTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    entryTarget: { ...typography.body, color: colors.textPrimary, fontWeight: "600", flexShrink: 1 },
    entryNarrowing: { ...typography.caption, color: colors.textSecondary },
    entryActions: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    actionChip: {
        paddingVertical: 4, paddingHorizontal: spacing.sm,
        borderRadius: 12, backgroundColor: colors.card,
        borderWidth: 1, borderColor: colors.cardBorder,
    },
    actionChipText: { ...typography.small, color: colors.textSecondary, fontWeight: "600" },
    actionChipDanger: { borderColor: colors.danger },
    actionChipDangerText: { ...typography.small, color: colors.danger, fontWeight: "700" },
})
