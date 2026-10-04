import { ParlayResponseData, SlotStatus } from "@/api"
import AppModal from "@/components/reusable/AppModal"
import ActionButton from "@/components/reusable/ActionButton"
import ActivityLoader from "@/components/reusable/ActivityLoader"
import useParlayAssessment from "@/composables/useParlayAssessment"
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import { colors, shadows, spacing, typography } from "@/theme/colors"
import { canReanalyze, shouldAnalyzeAutomatically, shouldShowSlot, slotNotice } from "@/util/assessments"
import Notice from "@/components/reusable/Notice"
import React, { useEffect, useRef } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import AssessmentSlotCard from "../assessments/AssessmentSlotCard"

type Props = {
    visible: boolean
    dismissModal: () => void
    parlay: ParlayResponseData
}

/**
 * Pick Analysis: reasons each pick on a lay might be a mistake, and the slate's as a whole.
 *
 * Loaded every time it opens rather than held, because whether an analysis still applies
 * depends on the picks as they are now — the server compares, and a copy kept from the
 * last open could be about picks that have since changed.
 *
 * Opening a lay with nothing analyzed yet starts the analysis straight away rather than
 * showing empty cards and a button. After that, "Re-analyze" is offered only while
 * something differs from what was analyzed.
 */
export default function ParlayAssessmentModal({ visible, dismissModal, parlay }: Props) {
    const { assessment, loading, requesting, load, request } = useParlayAssessment(parlay.id)
    const { sortedGamblers } = useGamblingSeasonContext()

    // Once per opening, so a failed first analysis is not retried in a loop.
    const autoRequested = useRef(false)

    useEffect(() => {
        if (!visible) return
        autoRequested.current = false
        load()
        // load is rebuilt every render; listing it would refetch on every one.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, parlay.id])

    useEffect(() => {
        if (!visible || !assessment || autoRequested.current) return
        if (shouldAnalyzeAutomatically(assessment)) {
            autoRequested.current = true
            request()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, assessment])

    // Gambler order, as everywhere else a lay's picks are listed.
    const pickSlots = sortedGamblers.flatMap(gambler => {
        const pick = parlay.picks.find(p => p.gambler_id === gambler.id)
        const slot = pick && assessment?.picks.find(s => s.pick_id === pick.id)
        return pick && slot && shouldShowSlot(slot) ? [{ gambler, pick, slot }] : []
    })

    const showParlay = assessment && shouldShowSlot(assessment.parlay)
    const autoStarting = assessment && shouldAnalyzeAutomatically(assessment)

    function body() {
        // One loader for the first load, the moment before the analysis it starts, and the
        // analysis itself, so the wait reads as one thing rather than a bare spinner that
        // gains a caption partway through.
        if (requesting || autoStarting || (!assessment && loading)) {
            // Centred in the card's fixed body. ActivityLoader fills its container, which is
            // why it needs one with a real height: in a card sized to its content it
            // collapsed, the spinner spilled out and the caption under it went missing.
            return (
                <View style={{ flex: 1, justifyContent: 'center', paddingVertical: spacing.xl }}>
                    <ActivityLoader text="Analyzing picks against past trends..." />
                </View>
            )
        }
        if (!assessment) {
            return null
        }
        if (!showParlay && pickSlots.length === 0) {
            // Everything analyzed came back clean — which is a result, not an empty screen.
            const analyzed = assessment.parlay.status !== SlotStatus.MISSING
            return <Notice message={analyzed
                ? "No concerns with any of these picks."
                : assessment.request_blocked_reason ?? "No analysis yet."} />
        }
        return (
            <ScrollView style={{ flex: 1, width: '100%' }}>
                {showParlay && (
                    <AssessmentSlotCard
                        slot={assessment.parlay}
                        notice={slotNotice(assessment.parlay)}
                    />
                )}
                {pickSlots.map(({ gambler, pick, slot }) => (
                    <AssessmentSlotCard
                        key={pick.id}
                        pick={pick}
                        gamblerName={gambler.firstName}
                        slot={slot}
                        notice={slotNotice(slot, pick)}
                    />
                ))}
            </ScrollView>
        )
    }

    return (
        <AppModal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={dismissModal}
        >
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: colors.overlay,
            }}>
                {/* A fixed height rather than one that follows the content: expanding a
                    concern scrolls inside the card instead of resizing the whole modal. */}
                <View style={{
                    width: '90%',
                    height: '80%',
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: 20,
                    padding: spacing.xl,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    ...shadows.modal,
                }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                        {/* The same flask as the button that opens this. */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                            <MaterialCommunityIcons name="flask" size={22} color={colors.success} />
                            <Text style={{ ...typography.title, color: colors.textPrimary }}>Pick Analysis</Text>
                        </View>
                        <Pressable onPress={dismissModal} style={{ padding: spacing.xs }}>
                            <Text style={{ fontSize: 22, color: colors.textSecondary }}>x</Text>
                        </Pressable>
                    </View>

                    <View style={{ flex: 1 }}>
                        {body()}
                    </View>

                    {assessment && !requesting && canReanalyze(assessment) && (
                        <View style={{ marginTop: spacing.md, alignItems: 'flex-end' }}>
                            <ActionButton text="Re-analyze" onPress={request} />
                        </View>
                    )}
                </View>
            </View>
        </AppModal>
    )
}
