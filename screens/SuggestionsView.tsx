import React, { useState } from "react"
import { Pressable, ScrollView, View } from "react-native"
import { RouteProp, useRoute } from "@react-navigation/native"
import Animated, { LinearTransition } from "react-native-reanimated"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { MainStackParamList } from "@/Main"
import { FeedbackResponseData } from "@/api"
import ActivityLoader from "@/components/reusable/ActivityLoader"
import Notice from "@/components/reusable/Notice"
import OverlayLoader from "@/components/reusable/OverlayLoader"
import TabButtons from "@/components/reusable/TabButtons"
import FeedbackCard from "@/components/feedback/FeedbackCard"
import FeedbackComposerModal from "@/components/feedback/FeedbackComposerModal"
import FeedbackDetailModal from "@/components/feedback/FeedbackDetailModal"
import { useFeedback, useFeedbackSections } from "@/composables/useFeedback"
import { colors, shadows, spacing } from "@/theme/colors"

type SuggestionsRouteProps = RouteProp<MainStackParamList, "Suggestions">

const TABS = ["Open", "Resolved", "Retired"] as const
type Tab = typeof TABS[number]

/**
 * Suggestions raised within a season.
 *
 * Reached from the season menu rather than a tab: it is not part of following the
 * competition, and a fourth tab would put it in front of people every time they open the app.
 */
export default function SuggestionsView() {
    const route = useRoute<SuggestionsRouteProps>()
    const feedback = useFeedback(route.params.seasonId)
    const sections = useFeedbackSections(feedback.feedback)

    const [tab, setTab] = useState<Tab>("Open")
    const [openId, setOpenId] = useState<number | null>(null)
    // Set to an id when editing, to `null` when raising a new suggestion, and absent when closed.
    const [composing, setComposing] = useState<{ id: number | null } | null>(null)

    const byId = (id: number | null) =>
        feedback.feedback.find(f => f.id === id) ?? null

    const selected = byId(openId)
    const editing = composing ? byId(composing.id) : null

    function renderCards(items: FeedbackResponseData[], isNew?: boolean) {
        return items.map(item => (
            // A vote re-ranks the list immediately, so the card has to visibly travel to
            // its new place — otherwise the row under your finger just becomes a
            // different suggestion. Keyed on the id so the wrapper follows the card.
            <Animated.View key={item.id} layout={LinearTransition.duration(260)}>
                <FeedbackCard
                    feedback={item}
                    pending={feedback.pendingId === item.id}
                    isNew={isNew}
                    onOpen={() => setOpenId(item.id)}
                    onVote={direction => feedback.vote(item.id, direction)}
                />
            </Animated.View>
        ))
    }

    if (!feedback.initialized) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <ActivityLoader text="Loading suggestions..." />
            </View>
        )
    }

    const counts: Record<Tab, number> = {
        Open: sections.recent.length + sections.ranked.length,
        Resolved: sections.resolved.length,
        Retired: sections.retired.length,
    }

    const openEmpty = counts.Open === 0
    // Nothing to divide unless both groups are actually on screen.
    const showDivider = sections.recent.length > 0 && sections.ranked.length > 0

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <TabButtons<Tab>
                tabs={TABS as unknown as Tab[]}
                activeTab={tab}
                setActiveTab={setTab}
                getKey={t => t}
                getDisplay={t => `${t} (${counts[t]})`}
                size="sm"
            />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    // Notice centres itself in the space it is given, and without this the
                    // empty state collapses to a line of text under the tabs.
                    flexGrow: 1,
                    padding: spacing.lg,
                    paddingTop: 0,
                    // Clears the add button, so the last card is never trapped under it.
                    paddingBottom: 96,
                    gap: spacing.md,
                }}
            >
                {tab === "Open" ? (
                    openEmpty ? (
                        <Notice message="No open suggestions. Add the first one." />
                    ) : (
                        <>
                            {/* Anything raised in the last few days leads, so a new suggestion is
                                seen before it has had time to collect votes. */}
                            {renderCards(sections.recent, true)}
                            {/* Both groups rank on score; the split is purely age, so
                                the rule marks where the NEW flags stop and nothing else. */}
                            {showDivider && (
                                <View style={{
                                    height: 1,
                                    backgroundColor: colors.divider,
                                    marginVertical: spacing.sm,
                                }} />
                            )}
                            {renderCards(sections.ranked)}
                        </>
                    )
                ) : tab === "Resolved" ? (
                    counts.Resolved === 0
                        ? <Notice message="Nothing has been resolved yet." />
                        : renderCards(sections.resolved)
                ) : (
                    counts.Retired === 0
                        ? <Notice message="Nothing has been retired yet." />
                        : renderCards(sections.retired)
                )}
            </ScrollView>

            <Pressable
                onPress={() => setComposing({ id: null })}
                accessibilityRole="button"
                accessibilityLabel="New suggestion"
                style={{
                    position: "absolute",
                    right: spacing.xl,
                    bottom: spacing.xl,
                    width: 56, height: 56, borderRadius: 28,
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: colors.accent,
                    ...shadows.glow,
                }}
            >
                <MaterialCommunityIcons name="plus" size={28} color={colors.textPrimary} />
            </Pressable>

            {/* The list is re-fetched after a new suggestion lands, behind whatever is on top —
                without this the screen sits on stale rows with no sign of the new one. */}
            {feedback.loading && <OverlayLoader />}

            <FeedbackDetailModal
                feedback={selected}
                viewerIsAdmin={feedback.viewerIsAdmin}
                saving={feedback.saving && feedback.pendingId === selected?.id}
                onClose={() => setOpenId(null)}
                onEdit={() => {
                    if (!selected) return
                    // Closed first: two stacked native modals fight over the keyboard.
                    setOpenId(null)
                    setComposing({ id: selected.id })
                }}
                onDelete={() => selected && feedback.remove(selected.id, () => setOpenId(null))}
                onVote={direction => selected && feedback.vote(selected.id, direction)}
                onSetStatus={status => selected && feedback.setStatus(selected.id, status)}
                onCommentCount={count => selected && feedback.setCommentCount(selected.id, count)}
            />

            <FeedbackComposerModal
                visible={composing !== null}
                feedback={editing}
                saving={feedback.saving}
                onClose={() => setComposing(null)}
                onSubmit={body => {
                    // Closed by the callback rather than here, so a failed save keeps the
                    // form up with what was written in it.
                    const done = () => setComposing(null)
                    if (editing) feedback.update(editing.id, body, done)
                    else feedback.create(body.comment, done)
                }}
            />
        </View>
    )
}
