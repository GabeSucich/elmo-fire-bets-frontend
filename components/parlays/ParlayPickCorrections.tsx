import { ParlayResponseData, PickResponseData } from "@/api"
import { Gambler, useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import TabButtons from "../reusable/TabButtons"
import { useState } from "react"
import { Text, TouchableOpacity, View } from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import OwnerPickEditor from "../picks/OwnerPickEditor"
import { useParlaysContext } from "@/contexts/parlaysContext"
import { colors, typography, spacing } from "@/theme/colors"
import useCorrectionImageAnalysis from "@/composables/useCorrectionImageAnalysis"
import ImageCorrectionFlow from "./corrections/ImageCorrectionFlow"
import StagedPickEditor from "./corrections/StagedPickEditor"
import { PickCreateEditData } from "../picks/common"

type CorrectionMode = 'manual' | 'image' | 'staged-edit'

type Props = {
    parlay: ParlayResponseData
    onDone: () => void
}

export default function ParlayPickCorrections(props: Props) {
    const {
        sortedGamblers
    } = useGamblingSeasonContext()

    const [correctedPicks, setCorrectedPicks] = useState<PickResponseData[]>([])

    function findGamblerPick(gamblerId: number) {
        const correctedPick = correctedPicks.find(p => p.gambler_id === gamblerId)
        if (correctedPick) return correctedPick

        return props.parlay.picks?.find(p => p.gambler_id === gamblerId) ?? null
    }

    function gamblerHasCorrection(gambler: Gambler) {
        const pick = findGamblerPick(gambler.id)
        return !!pick?.corrected_line
    }

    function getNextGamblerToFocus(startIndex?: number) {
        startIndex = startIndex ?? 0
        let nextGambler: Gambler | undefined = sortedGamblers.slice(startIndex).find(g => !gamblerHasCorrection(g))
        if (!nextGambler) {
            nextGambler = sortedGamblers.find(g => !gamblerHasCorrection(g))
        }
        return nextGambler ?? sortedGamblers[0]
    }

    const [focusedGambler, setFocusedGambler] = useState(getNextGamblerToFocus() ?? sortedGamblers[0])
    // The screenshot flow is the way corrections are normally made now; the manual editor
    // is the fallback, reached with the wand.
    const [mode, setMode] = useState<CorrectionMode>('image')

    // The row being edited in full during an image review. Its edit is staged, not saved.
    const [editingPickId, setEditingPickId] = useState<number | null>(null)

    // Owned here, not inside ImageCorrectionFlow, so that stepping out to correct one pick
    // by hand does not discard the analysis or the edits made to the other rows.
    const analysis = useCorrectionImageAnalysis(props.parlay)

    function handlePickOverrideSaved(pick: PickResponseData) {
        setCorrectedPicks([
            ...correctedPicks.filter(p => p.id !== pick.id),
            pick
        ])

        // This pick has been handled by hand; its suggestion is stale now.
        analysis.dropRows([pick.id])

        const gamblerIndex = Math.max(sortedGamblers.map(g => g.id).indexOf(pick.gambler_id))
        const nextGambler = getNextGamblerToFocus(gamblerIndex + 1)
        setFocusedGambler(nextGambler)
    }

    function handleImageCorrectionsApplied(picks: PickResponseData[]) {
        const appliedIds = picks.map(p => p.id)
        setCorrectedPicks([
            ...correctedPicks.filter(p => !appliedIds.includes(p.id)),
            ...picks
        ])
    }

    function handleEditFully(pickId: number) {
        setEditingPickId(pickId)
        setMode('staged-edit')
    }

    /** Hold the edit against the row; it is written with everything else on submit. */
    function handleStagedEdit(pickId: number, data: PickCreateEditData) {
        analysis.updateRow(pickId, { edit: data, value: data.line.toString() })
        setEditingPickId(null)
        setMode('image')
    }

    function returnToReview() {
        setEditingPickId(null)
        setMode('image')
    }

    function toggleMode() {
        setEditingPickId(null)
        setMode(mode === 'image' ? 'manual' : 'image')
    }

    function needsCorrectionText() {
        const gamblersNeedingCorrectionCnt = sortedGamblers.filter(g => !gamblerHasCorrection(g)).length
        if (gamblersNeedingCorrectionCnt === 0) return null
        if (gamblersNeedingCorrectionCnt === 1) return `1 correction needed`
        return `${gamblersNeedingCorrectionCnt} corrections needed`
    }

    function getGamblerTabDisplay(gambler: Gambler) {
        if (gamblerHasCorrection(gambler)) return gambler.firstName
        return `${gambler.firstName} (!)`
    }

    const correctionText = needsCorrectionText()
    const editingRow = analysis.rows.find(row => row.pick.id === editingPickId) ?? null

    return (
        <View>
            {/* Dismissal belongs to the modal's own X — a second Close here was just a
                duplicate of it. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    {correctionText && (
                        <>
                            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: colors.danger }} />
                            <Text style={{ ...typography.caption, color: colors.danger, fontWeight: '500' }}>{correctionText}</Text>
                        </>
                    )}
                    {/* Only the manual editor needs a way back; the screenshot flow carries
                        its own "Correct manually" link. */}
                    {mode === 'manual' && (
                        <TouchableOpacity
                            onPress={toggleMode}
                            style={{ marginLeft: spacing.sm }}
                            accessibilityLabel="Correct picks from a screenshot"
                        >
                            <MaterialCommunityIcons
                                name="auto-fix"
                                size={22}
                                // Stays lit while an analysis is still open, so it reads as the
                                // way back to a review already in progress.
                                color={analysis.rows.length > 0 ? colors.accent : colors.textSecondary}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            {mode === 'staged-edit' && editingRow ? (
                <StagedPickEditor
                    row={editingRow}
                    onStage={data => handleStagedEdit(editingRow.pick.id, data)}
                    onCancel={returnToReview}
                />
            ) : mode === 'image' ? (
                <ImageCorrectionFlow
                    analysis={analysis}
                    onCorrectionsApplied={handleImageCorrectionsApplied}
                    onEditFully={handleEditFully}
                    onDone={props.onDone}
                    onCorrectManually={() => setMode('manual')}
                />
            ) : (
                <>
                    <TabButtons<Gambler>
                        tabs={sortedGamblers}
                        activeTab={focusedGambler}
                        setActiveTab={g => setFocusedGambler(g)}
                        getDisplay={g => getGamblerTabDisplay(g)}
                        getKey={g => `parlay-correction-${g.id}`}
                        size="sm"
                        colorProps={g => gamblerHasCorrection(g)
                            ? {}
                            : { textColor: colors.danger, activeBackgroundColor: colors.danger, activeTextColor: colors.textPrimary }
                        }
                    />
                    <OwnerPickEditor
                        key={focusedGambler.id}
                        gamblerId={focusedGambler.id}
                        parlay={props.parlay}
                        pick={findGamblerPick(focusedGambler.id)}
                        onPickCorrected={p => handlePickOverrideSaved(p)}
                    />
                </>
            )}
        </View>
    )
}
