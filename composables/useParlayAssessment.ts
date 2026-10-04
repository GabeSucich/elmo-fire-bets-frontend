import { AssessmentsService, ParlayAssessmentResponseData } from "@/api"
import { useState } from "react"
import useApiActionState from "./useApiActionState"

/**
 * One parlay's pick assessment: what is stored, and asking for a new one.
 *
 * Asking is slow — every pick and the slate go to the model in parallel, and the wait is
 * the slowest of them, often fifteen seconds — so `requesting` is kept apart from
 * `loading` for the screen to show something that says so rather than a bare spinner.
 */
export default function useParlayAssessment(parlayId: number) {
    const [assessment, setAssessment] = useState<ParlayAssessmentResponseData | null>(null)
    const [loading, setLoading] = useState(false)
    const [requesting, setRequesting] = useState(false)

    const { execute: load } = useApiActionState(
        () => AssessmentsService.getParlayAssessment(parlayId),
        setAssessment,
        setLoading,
        "Could not load the pick analysis.",
        { retryable: true },
    )

    const { execute: request } = useApiActionState(
        () => AssessmentsService.requestParlayAssessment(parlayId),
        setAssessment,
        setRequesting,
        "Could not analyze the picks. Try again in a moment.",
    )

    return { assessment, loading, requesting, load, request }
}
