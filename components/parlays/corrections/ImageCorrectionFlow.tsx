import { PickResponseData, PicksService } from "@/api"
import { playerTeamResultToRequestData } from "@/util/executePlayerSearch"
import { CorrectionImageAnalysis, ReviewRowState } from "@/composables/useCorrectionImageAnalysis"
import { useLoadingState } from "@/composables/useLoadingState"
import { useToastContext } from "@/contexts/toastContext"
import { colors, spacing, typography } from "@/theme/colors"
import { ScrollView, Text, TouchableOpacity, View } from "react-native"
import ActionButton from "../../reusable/ActionButton"
import Notice from "../../reusable/Notice"
import OverlayLoader from "../../reusable/OverlayLoader"
import AnalysisProgress from "./AnalysisProgress"
import CorrectionReviewRow from "./CorrectionReviewRow"

type Props = {
    analysis: CorrectionImageAnalysis
    onCorrectionsApplied: (picks: PickResponseData[]) => void
    onEditFully: (pickId: number) => void
    /** Leaves the corrections view entirely, refreshing the parlay behind it. */
    onDone: () => void
    onCorrectManually: () => void
}

export default function ImageCorrectionFlow(props: Props) {
    const { showToast } = useToastContext()
    const { loading, setLoading } = useLoadingState()

    const {
        phase, legs, statedLegCount, rows, analyze, updateRow, dropRows, reset,
    } = props.analysis

    function hasUsableValue(row: ReviewRowState) {
        return !Number.isNaN(parseFloat(row.value))
    }

    // Every row is submitted, including ones the slip had nothing to say about — applying a
    // pick's existing line is what marks it as already correct, and it leaves the parlay with
    // no uncorrected picks, which is what finalizing needs.
    async function applyCorrections() {
        const toApply = rows.filter(hasUsableValue)
        if (toApply.length === 0 || toApply.length !== rows.length) return

        setLoading(true)
        const outcomes = await Promise.allSettled(toApply.map(row => {
            const line = parseFloat(row.value)
            // A row edited by hand carries the whole pick; everything else moves only its number.
            return row.edit
                ? PicksService.applyPickOverride(row.pick.id, {
                    target: playerTeamResultToRequestData(row.edit.playerTeamResult),
                    prop_type: row.edit.propType,
                    direction: row.edit.direction,
                    sauce_factor: row.edit.sauceFactor,
                    delete_veto: row.edit.deleteVeto,
                    line,
                })
                : PicksService.applyPickOverride(row.pick.id, { line })
        }))
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

        if (applied.length > 0) props.onCorrectionsApplied(applied)

        if (failedNames.length > 0) {
            // Successes stay applied; only the failures are left on screen to retry.
            dropRows(applied.map(pick => pick.id))
            showToast(`Could not save corrections for ${failedNames.join(', ')}`)
            return
        }

        // Everything landed, so there is nothing left to do here. Closing refreshes the
        // parlay underneath, which is where the corrections actually need to show up.
        reset()
        props.onDone()
    }

    // The way out to the manual editor. Not offered mid-analysis, where leaving would
    // discard work already in flight.
    const manualLink = (
        <View style={{ alignItems: 'flex-end', marginTop: spacing.lg }}>
            <TouchableOpacity onPress={props.onCorrectManually}>
                <Text style={{ ...typography.caption, color: colors.accent, fontWeight: '600' }}>
                    Correct manually
                </Text>
            </TouchableOpacity>
        </View>
    )

    if (phase === 'extracting' || phase === 'matching') {
        return <AnalysisProgress phase={phase} />
    }

    if (phase !== 'review') {
        return (
            <View style={{ gap: spacing.md, paddingVertical: spacing.lg }}>
                <Notice message="Upload one or more screenshots of the parlay slip and each pick will be matched to a bet line automatically." />
                <View style={{ alignItems: 'center' }}>
                    <ActionButton text="Choose screenshots" onPress={analyze} />
                </View>
                {manualLink}
            </View>
        )
    }

    const matchedCount = rows.filter(row => row.leg).length
    const legsMissing = statedLegCount != null && statedLegCount > legs.length

    const unusable = rows.filter(row => !hasUsableValue(row))
    const canApply = rows.length > 0 && unusable.length === 0

    // Lines that were read off the slip but claimed by nobody. Showing them turns an
    // unexplained "no match" into something diagnosable — usually the bet type was read
    // differently from how the pick was recorded.
    const claimedLegs = new Set(rows.map(row => row.leg?.leg_index).filter(index => index != null))
    const unusedLegs = legs.filter(leg => !claimedLegs.has(leg.leg_index))

    return (
        <View style={{ gap: spacing.sm }}>
            {loading && <OverlayLoader loaderProps={{ text: "Saving corrections...", size: 20 }} />}

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
                        key={row.pick.id}
                        row={row}
                        onChangeValue={value => updateRow(row.pick.id, { value })}
                        onEditFully={() => props.onEditFully(row.pick.id)}
                    />
                ))}
            </ScrollView>

            {unusable.length > 0 && (
                <Text style={{ ...typography.caption, color: colors.danger, fontWeight: '600' }}>
                    {unusable.map(row => row.gamblerName).join(', ')}
                    {unusable.length === 1 ? ' needs' : ' need'} a number before this can be applied.
                </Text>
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <ActionButton text="Start over" onPress={reset} color={colors.buttonSecondary} />
                <ActionButton
                    text={`Apply ${rows.length} correction${rows.length === 1 ? '' : 's'}`}
                    onPress={applyCorrections}
                    disabled={!canApply}
                />
            </View>

            {manualLink}
        </View>
    )
}
