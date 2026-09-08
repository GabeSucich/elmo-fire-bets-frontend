import { View } from "react-native"
import ActivityLoader from "../../reusable/ActivityLoader"

export default function AnalysisProgress() {
    return (
        // Fills the modal rather than sitting as a small step list, so the wait reads as
        // the whole screen being busy. One message across both phases: reading the slip and
        // matching it to picks are one wait from the outside, and swapping the label
        // mid-flight only drew attention to a boundary nobody cares about.
        <View style={{ minHeight: 340, justifyContent: 'center' }}>
            <ActivityLoader text="Analyzing slip..." />
        </View>
    )
}
