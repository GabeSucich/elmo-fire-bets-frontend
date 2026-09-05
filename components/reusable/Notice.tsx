import { Text, View } from "react-native"
import { colors, typography, spacing } from "@/theme/colors"

type Props = {
    message: string
}

/**
 * In-flow guidance that stands in for content the user cannot act on yet.
 *
 * This is not an error — failures are transient and belong in a toast. Use this when a screen
 * has a persistent reason for showing nothing, derived from state rather than from an event.
 */
export default function Notice({ message }: Props) {
    return (
        <View style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: spacing.lg,
        }}>
            <Text style={{
                color: colors.textSecondary,
                fontStyle: 'italic',
                textAlign: 'center',
                ...typography.body,
            }}>{ message }</Text>
        </View>
    )
}
