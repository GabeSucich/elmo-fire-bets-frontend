import { FeedbackStatus } from "@/api"
import { colors } from "@/theme/colors"

type StatusStyle = {
    /** Shown on the card and in the detail header. Open needs no tag. */
    tag: string | null
    color: string
    icon: string
}

export const STATUS_STYLE: Record<FeedbackStatus, StatusStyle> = {
    [FeedbackStatus.OPEN]: { tag: null, color: colors.textSecondary, icon: "lightbulb-outline" },
    [FeedbackStatus.RESOLVED]: { tag: "RESOLVED", color: colors.success, icon: "check" },
    // Grey rather than red: retiring is an answer, not a failure, and it should not read
    // louder in the list than the suggestions that were actually built.
    [FeedbackStatus.RETIRED]: { tag: "RETIRED", color: colors.textMuted, icon: "archive-outline" },
}

export const isSettled = (status: FeedbackStatus) => status !== FeedbackStatus.OPEN
