import { ParlayResponseData } from "@/api"
import { useState } from "react"
import { View } from "react-native"
import useCorrectionImageAnalysis from "@/composables/useCorrectionImageAnalysis"
import ImageCorrectionFlow from "./corrections/ImageCorrectionFlow"
import StagedPickEditor from "./corrections/StagedPickEditor"
import { PickCreateEditData } from "../picks/common"

type CorrectionMode = 'review' | 'staged-edit'

type Props = {
    parlay: ParlayResponseData
    onDone: () => void
    /** Every adjustment saved, as opposed to the view merely being closed. */
    onSubmitted?: () => void
    /**
     * Reached while locking a parlay. The slip is the only path offered: manual entry is
     * hidden, and finishing hands back so the caller can lock.
     */
    locking?: boolean
}

export default function ParlayPickCorrections(props: Props) {
    const [mode, setMode] = useState<CorrectionMode>('review')

    // The row being edited in full during an image review. Its edit is staged, not saved.
    const [editingGamblerId, setEditingGamblerId] = useState<number | null>(null)

    // Owned here, not inside ImageCorrectionFlow, so that stepping out to correct one pick
    // by hand does not discard the analysis or the edits made to the other rows.
    const analysis = useCorrectionImageAnalysis(props.parlay)

    function handleEditFully(gamblerId: number) {
        setEditingGamblerId(gamblerId)
        setMode('staged-edit')
    }

    /** Hold the edit against the row; it is written with everything else on submit. */
    function handleStagedEdit(gamblerId: number, data: PickCreateEditData) {
        analysis.updateRow(gamblerId, { edit: data, value: data.line.toString() })
        setEditingGamblerId(null)
        setMode('review')
    }

    function returnToReview() {
        setEditingGamblerId(null)
        setMode('review')
    }

    const editingRow = analysis.rows.find(row => row.gamblerId === editingGamblerId) ?? null

    return (
        <View>
            {mode === 'staged-edit' && editingRow ? (
                <StagedPickEditor
                    row={editingRow}
                    onStage={data => handleStagedEdit(editingRow.gamblerId, data)}
                    onCancel={returnToReview}
                />
            ) : (
                <ImageCorrectionFlow
                    analysis={analysis}
                    onEditFully={handleEditFully}
                    onDone={props.onDone}
                    onEnterManually={props.locking ? undefined : analysis.startManual}
                    onSubmitted={props.onSubmitted}
                />
            )}
        </View>
    )
}
