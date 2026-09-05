import { AnalysisPhase } from "@/composables/useCorrectionImageAnalysis"
import { View } from "react-native"
import ActivityLoader from "../../reusable/ActivityLoader"

type Props = {
    phase: Extract<AnalysisPhase, 'extracting' | 'matching'>
}

const PHASE_TEXT: Record<Props['phase'], string> = {
    extracting: "Analyzing slip",
    matching: "Applying corrections",
}

export default function AnalysisProgress({ phase }: Props) {
    return (
        // Fills the modal rather than sitting as a small step list, so the wait reads as
        // the whole screen being busy.
        <View style={{ minHeight: 340, justifyContent: 'center' }}>
            <ActivityLoader text={PHASE_TEXT[phase]} />
        </View>
    )
}
