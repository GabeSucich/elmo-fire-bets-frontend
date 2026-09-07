import { CorrectionSuggestion, CorrectionsService, ExtractedLeg, ParlayResponseData, PickResponseData, SauceFactor } from "@/api"
import { PickCreateEditData } from "@/components/picks/common"
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import { useToastContext } from "@/contexts/toastContext"
import { setApiErrorMsg } from "@/util/error"
import { getPickLine } from "@/util/picks"
import { File } from "expo-file-system"
import * as ImagePicker from "expo-image-picker"
import { useState } from "react"

/** Mirrors MAX_IMAGES in the corrections router. */
const MAX_IMAGES = 6

export type AnalysisPhase = 'idle' | 'extracting' | 'matching' | 'review'

export type ReviewRowState = {
    /** Rows are per gambler, not per pick — a gambler with no pick still needs one. */
    gamblerId: number
    gamblerName: string
    pick: PickResponseData | null
    leg: ExtractedLeg | null
    note: string | null
    directionMismatch: boolean
    looseTargetMatch: boolean
    /** The number that will be written as this pick's correction. Empty when there is no pick. */
    value: string
    /**
     * A full edit staged from the pick editor — target, bet type, direction, sauce. Held here
     * rather than written straight away so the whole parlay is corrected in one submission.
     * For a gambler with no pick this is the only way the row can be satisfied.
     */
    edit: PickCreateEditData | null
    /**
     * A spicy/bitch change made on the row itself, kept apart from `edit` so a gambler can
     * re-designate a pick without opening the full editor. Undefined means "leave it as it
     * is"; null is a real value meaning neither spicy nor bitch.
     */
    sauceFactor?: SauceFactor | null
}

/**
 * Reads parlay screenshots and proposes a corrected number for each recorded pick.
 *
 * The two phases are two ordinary API calls rather than a streamed one, so the progress
 * the user sees is a real request boundary. Nothing here writes — the caller submits
 * every row through the normal pick create/override paths.
 *
 * Review state lives here rather than in the component that renders it so that leaving
 * the flow — to edit one pick in full, say — does not throw away the analysis or any
 * edits already made to the other rows.
 */
export default function useCorrectionImageAnalysis(parlay: ParlayResponseData) {
    const [phase, setPhase] = useState<AnalysisPhase>('idle')
    const [legs, setLegs] = useState<ExtractedLeg[]>([])
    const [statedLegCount, setStatedLegCount] = useState<number | null>(null)
    const [rows, setRows] = useState<ReviewRowState[]>([])

    const { sortedGamblers } = useGamblingSeasonContext()
    const { showToast } = useToastContext()

    function buildRows(extractedLegs: ExtractedLeg[], suggestions: CorrectionSuggestion[]): ReviewRowState[] {
        const legsByIndex = new Map(extractedLegs.map(leg => [leg.leg_index, leg]))

        return sortedGamblers.map(gambler => {
            const pick = parlay.picks.find(p => p.gambler_id === gambler.id) ?? null
            const suggestion = pick ? suggestions.find(s => s.pick_id === pick.id) ?? null : null
            const leg = suggestion?.matched_leg_index != null
                ? legsByIndex.get(suggestion.matched_leg_index) ?? null
                : null

            return {
                gamblerId: gambler.id,
                gamblerName: gambler.firstName,
                pick,
                leg,
                note: suggestion?.note ?? null,
                directionMismatch: suggestion?.direction_mismatch ?? false,
                looseTargetMatch: suggestion?.loose_target_match ?? false,
                // Where the slip had nothing to say, the pick's own line stands. Submitting
                // it unchanged is how a pick gets confirmed as already correct.
                value: pick ? (suggestion?.suggested_number ?? getPickLine(pick)).toFixed(1) : '',
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

    function updateRow(gamblerId: number, changes: Partial<ReviewRowState>) {
        setRows(current => current.map(row => row.gamblerId === gamblerId ? { ...row, ...changes } : row))
    }

    /** Drop rows whose gamblers have been dealt with elsewhere — applied, or corrected by hand. */
    function dropRows(gamblerIds: number[]) {
        setRows(current => current.filter(row => !gamblerIds.includes(row.gamblerId)))
    }

    function reset() {
        setLegs([])
        setStatedLegCount(null)
        setRows([])
        setPhase('idle')
    }

    return {
        parlayId: parlay.id,
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
