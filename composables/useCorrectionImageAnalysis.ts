import { CorrectionSuggestion, ExtractedLeg, ParlayResponseData, PickResponseData, CorrectionsService } from "@/api"
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import { useToastContext } from "@/contexts/toastContext"
import { setApiErrorMsg } from "@/util/error"
import { getPickLine } from "@/util/picks"
import { PickCreateEditData } from "@/components/picks/common"
import { File } from "expo-file-system"
import * as ImagePicker from "expo-image-picker"
import { useState } from "react"

/** Mirrors MAX_IMAGES in the corrections router. */
const MAX_IMAGES = 6

export type AnalysisPhase = 'idle' | 'extracting' | 'matching' | 'review'

export type ReviewRowState = {
    pick: PickResponseData
    gamblerName: string
    leg: ExtractedLeg | null
    note: string | null
    directionMismatch: boolean
    looseTargetMatch: boolean
    /** The number that will be written as this pick's correction. Always editable. */
    value: string
    /**
     * A full edit staged from "Edit fully" — target, bet type, direction, sauce. Held here
     * rather than written straight away so the whole parlay is corrected in one submission.
     */
    edit: PickCreateEditData | null
}

/**
 * Reads parlay screenshots and proposes a corrected number for each recorded pick.
 *
 * The two phases are two ordinary API calls rather than a streamed one, so the progress
 * the user sees is a real request boundary. Nothing here writes — the caller submits
 * every row through the normal pick override path.
 *
 * Review state lives here rather than in the component that renders it so that leaving
 * the flow — to correct one pick by hand, say — does not throw away the analysis or any
 * edits already made to the other rows.
 */
export default function useCorrectionImageAnalysis(parlay: ParlayResponseData) {
    const [phase, setPhase] = useState<AnalysisPhase>('idle')
    const [legs, setLegs] = useState<ExtractedLeg[]>([])
    const [statedLegCount, setStatedLegCount] = useState<number | null>(null)
    const [rows, setRows] = useState<ReviewRowState[]>([])

    const { gamblers } = useGamblingSeasonContext()
    const { showToast } = useToastContext()

    function buildRows(extractedLegs: ExtractedLeg[], suggestions: CorrectionSuggestion[]): ReviewRowState[] {
        const legsByIndex = new Map(extractedLegs.map(leg => [leg.leg_index, leg]))

        return parlay.picks.map(pick => {
            const suggestion = suggestions.find(s => s.pick_id === pick.id) ?? null
            const leg = suggestion?.matched_leg_index != null
                ? legsByIndex.get(suggestion.matched_leg_index) ?? null
                : null

            return {
                pick,
                gamblerName: gamblers[pick.gambler_id]?.firstName ?? 'Unknown',
                leg,
                note: suggestion?.note ?? null,
                directionMismatch: suggestion?.direction_mismatch ?? false,
                looseTargetMatch: suggestion?.loose_target_match ?? false,
                // Where the slip had nothing to say, the pick's own line stands. Submitting
                // it unchanged is how a pick gets confirmed as already correct.
                value: (suggestion?.suggested_number ?? getPickLine(pick)).toFixed(1),
                edit: null,
            }
        })
    }

    async function analyze() {
        const picked = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: MAX_IMAGES,
            quality: 0.8,
        })

        if (picked.canceled || picked.assets.length === 0) return

        try {
            setPhase('extracting')
            const images = await Promise.all(
                picked.assets.map(asset => new File(asset.uri).base64())
            )
            const extracted = await CorrectionsService.extractCorrectionLegs(parlay.id, { images })

            setPhase('matching')
            const matched = await CorrectionsService.matchCorrectionLegs(parlay.id, { legs: extracted.legs })

            setLegs(extracted.legs)
            setStatedLegCount(extracted.stated_leg_count)
            setRows(buildRows(extracted.legs, matched.suggestions))
            setPhase('review')
        } catch (error) {
            setPhase('idle')
            setApiErrorMsg(
                error,
                message => showToast(message),
                "There was an error reading that parlay screenshot"
            )
        }
    }

    function updateRow(pickId: number, changes: Partial<ReviewRowState>) {
        setRows(current => current.map(row => row.pick.id === pickId ? { ...row, ...changes } : row))
    }

    /** Drop rows whose picks have been dealt with elsewhere — applied, or corrected by hand. */
    function dropRows(pickIds: number[]) {
        setRows(current => current.filter(row => !pickIds.includes(row.pick.id)))
    }

    function reset() {
        setLegs([])
        setStatedLegCount(null)
        setRows([])
        setPhase('idle')
    }

    return {
        phase,
        legs,
        statedLegCount,
        rows,
        analyze,
        updateRow,
        dropRows,
        reset,
    }
}

export type CorrectionImageAnalysis = ReturnType<typeof useCorrectionImageAnalysis>
