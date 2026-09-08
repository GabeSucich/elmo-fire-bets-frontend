import React, { useState } from "react"
import { PickResponseData, PicksService } from "@/api"
import { playerTeamResultToRequestData } from "@/util/executePlayerSearch"
import { CorrectionImageAnalysis, ReviewRowState } from "@/composables/useCorrectionImageAnalysis"
import { useLoadingState } from "@/composables/useLoadingState"
import { useToastContext } from "@/contexts/toastContext"
import { colors, spacing, typography } from "@/theme/colors"
import { ScrollView, Text, View } from "react-native"
import ActionButton from "../../reusable/ActionButton"
import Notice from "../../reusable/Notice"
import OverlayLoader from "../../reusable/OverlayLoader"
import AnalysisProgress from "./AnalysisProgress"
import CorrectionReviewRow from "./CorrectionReviewRow"

type Props = {
    analysis: CorrectionImageAnalysis
    onEditFully: (gamblerId: number) => void
    /** Leaves the adjustments view entirely, refreshing the parlay behind it. */
    onDone: () => void
    /**
     * Every adjustment saved. Distinct from onDone, which also fires when the view is
     * simply closed — a caller that acts on completion must not act on abandonment.
     */
    onSubmitted?: () => void
    /** Omitted when the flow is reached while locking, where the slip is the only route. */
    onEnterManually?: () => void
}

export default function ImageCorrectionFlow(props: Props) {
    const { showToast } = useToastContext()
    const { loading, setLoading } = useLoadingState()

    const {
        parlayId, phase, legs, statedLegCount, rows, analyze, updateRow, dropRows, reset,
    } = props.analysis

    /** The picker takes a moment to appear; without this the tap looks like it did nothing. */
    const [openingLibrary, setOpeningLibrary] = useState(false)

    async function startAnalyze() {
        setOpeningLibrary(true)
        try {
            await analyze()
        } finally {
            setOpeningLibrary(false)
        }
    }

    /** A row is ready when it will write something: a number, or a pick that does not exist yet. */
    function isReady(row: ReviewRowState) {
        if (!row.pick) return row.edit !== null
        return row.edit !== null || !Number.isNaN(parseFloat(row.value))
    }

    function submitRow(row: ReviewRowState) {
        // A gambler with no recorded pick gets one created, already corrected.
        if (!row.pick) {
            const edit = row.edit!
            return PicksService.createPick({
                gambler_id: row.gamblerId,
                parlay_id: parlayId,
                target: playerTeamResultToRequestData(edit.playerTeamResult),
                prop_type: edit.propType,
                direction: edit.direction,
                sauce_factor: row.sauceFactor !== undefined ? row.sauceFactor : edit.sauceFactor,
                line: edit.line,
                corrected_line: edit.line,
            })
        }
        const line = parseFloat(row.value)
        // A row edited by hand carries the whole pick; everything else moves only its number.
        // A row-level sauce change rides along with whichever shape the override takes;
        // undefined leaves the field out entirely so the stored value is untouched.
        const sauce = row.sauceFactor !== undefined ? { sauce_factor: row.sauceFactor } : {}
        return row.edit
            ? PicksService.applyPickOverride(row.pick.id, {
                target: playerTeamResultToRequestData(row.edit.playerTeamResult),
                prop_type: row.edit.propType,
                direction: row.edit.direction,
                sauce_factor: row.edit.sauceFactor,
                delete_veto: row.edit.deleteVeto,
                line,
                ...sauce,
            })
            : PicksService.applyPickOverride(row.pick.id, { line, ...sauce })
    }

    // Every row is submitted, including ones the slip had nothing to say about — applying a
    // pick's existing line is what marks it as already correct, and it leaves the parlay with
    // no uncorrected picks, which is what finalizing needs.
    async function applyCorrections() {
        const toApply = rows.filter(isReady)
        if (toApply.length === 0 || toApply.length !== rows.length) return

        setLoading(true)
        const outcomes = await Promise.allSettled(toApply.map(submitRow))
        setLoading(false)

        const applied: PickResponseData[] = []
        const failedNames: string[] = []

        outcomes.forEach((outcome, index) => {
            if (outcome.status === 'fulfilled') {
                applied.push(outcome.value.pick)
            } else {
                failedNames.push(toApply[index].gamblerName)
            }
        })

        if (failedNames.length > 0) {
            // Successes stay applied; only the failures are left on screen to retry.
            dropRows(applied.map(pick => pick.gambler_id))
            showToast(`Could not save adjustments for ${failedNames.join(', ')}`)
            return
        }

        // Everything landed, so there is nothing left to do here. Closing refreshes the
        // parlay underneath, which is where the adjustments actually need to show up.
        reset()
        props.onSubmitted?.()
        props.onDone()
    }

    // Opens the same review with empty rows rather than a separate editor. Not offered
    // when locking, where the slip is the whole point. Neutral and inline: it is the
    // alternative to the screenshot, not the way forward.
    const manualButton = !props.onEnterManually ? null : (
        <ActionButton
            text="Enter manually"
            onPress={props.onEnterManually}
            color={colors.buttonSecondary}
        />
    )

    function renderPhase() {
        if (phase === 'extracting' || phase === 'matching') {
            return <AnalysisProgress />
        }

        if (phase !== 'review') {
            return (
                <View style={{ gap: spacing.md, paddingVertical: spacing.lg }}>
                    <Notice message="Upload one or more screenshots of the parlay slip and each pick will be matched to a bet line automatically." />
                    {/* Centred as a pair rather than pushed to the edges: they are two choices
                        of the same action, not opposing ends of the dialog. */}
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: spacing.md,
                    }}>
                        {manualButton}
                        <ActionButton text="Add images" onPress={startAnalyze} loading={openingLibrary} />
                    </View>
                </View>
            )
        }

        const matchedCount = rows.filter(row => row.leg).length
        const legsMissing = statedLegCount != null && statedLegCount > legs.length

        const notReady = rows.filter(row => !isReady(row))
        const missingPicks = notReady.filter(row => !row.pick)
        const badNumbers = notReady.filter(row => row.pick)
        const canApply = rows.length > 0 && notReady.length === 0

        // Lines that were read off the slip but claimed by nobody. Showing them turns an
        // unexplained "no match" into something diagnosable — usually the bet type was read
        // differently from how the pick was recorded.
        const claimedLegs = new Set(rows.map(row => row.leg?.leg_index).filter(index => index != null))
        const unusedLegs = legs.filter(leg => !claimedLegs.has(leg.leg_index))

        return (
            <View style={{ gap: spacing.sm }}>
                {loading && <OverlayLoader loaderProps={{ text: "Saving adjustments...", size: 20 }} />}

                <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                    Matched {matchedCount} of {rows.length} picks to a line on the slip.
                </Text>

                {legsMissing && (
                    <Text style={{ ...typography.caption, color: colors.warning, fontWeight: '600' }}>
                        ⚠ The slip says it has {statedLegCount} legs but only {legs.length} were read. You may be missing a screenshot.
                    </Text>
                )}

                {unusedLegs.length > 0 && (
                    <View style={{ gap: spacing.xs }}>
                        <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                            {unusedLegs.length === 1
                                ? "1 line on the slip was not matched to anyone:"
                                : `${unusedLegs.length} lines on the slip were not matched to anyone:`}
                        </Text>
                        {unusedLegs.map(leg => (
                            <Text
                                key={leg.leg_index}
                                style={{ ...typography.caption, color: colors.textSecondary, fontStyle: 'italic' }}
                            >
                                · {leg.raw_text} {leg.prop_type ? `(read as ${leg.prop_type})` : '(bet type not recognized)'}
                            </Text>
                        ))}
                    </View>
                )}

                <ScrollView style={{ maxHeight: 400 }} contentContainerStyle={{ gap: spacing.sm }}>
                    {rows.map(row => (
                        <CorrectionReviewRow
                            key={row.gamblerId}
                            row={row}
                            onChangeValue={value => updateRow(row.gamblerId, { value })}
                            onChangeSauce={sauceFactor => updateRow(row.gamblerId, { sauceFactor })}
                            onEditFully={() => props.onEditFully(row.gamblerId)}
                        />
                    ))}
                </ScrollView>

                {missingPicks.length > 0 && (
                    <Text style={{ ...typography.caption, color: colors.warning, fontWeight: '600' }}>
                        {missingPicks.map(row => row.gamblerName).join(', ')}
                        {missingPicks.length === 1 ? ' has' : ' have'} no pick. Use "Add pick" before applying.
                    </Text>
                )}

                {badNumbers.length > 0 && (
                    <Text style={{ ...typography.caption, color: colors.danger, fontWeight: '600' }}>
                        {badNumbers.map(row => row.gamblerName).join(', ')}
                        {badNumbers.length === 1 ? ' needs' : ' need'} a number before this can be applied.
                    </Text>
                )}

                {/* Set off from the rows above: the list runs right up to these, and a
                    committing action needs a moment of space before it. */}
                <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: spacing.lg,
                }}>
                    <ActionButton text="Start over" onPress={reset} color={colors.buttonSecondary} />
                    <ActionButton
                        text="Save slip"
                        onPress={applyCorrections}
                        disabled={!canApply}
                    />
                </View>
            </View>
        )
    }

    return (
        <>
            {renderPhase()}
        </>
    )
}
