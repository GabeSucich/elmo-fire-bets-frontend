import React from "react"
import { Pressable, Text, View } from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { FeedbackResponseData } from "@/api"
import OverlayLoader from "@/components/reusable/OverlayLoader"
import { relativeTime } from "@/util/relativeTime"
import { colors, shadows, spacing, typography } from "@/theme/colors"
import VoteControl, { VoteDirection } from "./VoteControl"
import { STATUS_STYLE, isSettled } from "./status"

/** Room reserved on the meta row for the reply count pinned in the corner below it. */
const REPLY_COUNT_WIDTH = 34

/** Room reserved on the title for whichever of the two markers holds the top corner. */
const NEW_FLAG_WIDTH = 48
const AGE_WIDTH = 34

type Props = {
    feedback: FeedbackResponseData
    pending: boolean
    /** Raised recently enough to lead the list — flagged so it reads as newly arrived. */
    isNew?: boolean
    onOpen: () => void
    onVote: (direction: VoteDirection) => void
}

/**
 * One suggestion in the list: enough to decide whether to open it, and the vote without having to.
 *
 * The title carries it — it is written from the description precisely so this row can be
 * scanned — with the description itself held back for the detail view.
 */
export default function FeedbackCard({ feedback, pending, isNew, onOpen, onVote }: Props) {
    const settled = isSettled(feedback.status)
    const status = STATUS_STYLE[feedback.status]

    return (
        <Pressable onPress={onOpen} style={{
            backgroundColor: colors.card,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            paddingHorizontal: spacing.lg,
            // The vote stack is the tallest thing in here and already carries its own
            // space above and below, so a full pad on top of it only adds emptiness.
            paddingVertical: spacing.sm,
            opacity: settled ? 0.7 : 1,
            ...shadows.card,
        }}>
            {pending && <OverlayLoader loaderProps={{ size: 20 }} />}

            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg }}>
                {/* Stacked on the left, which leaves the top-right corner free for the
                    NEW flag and keeps the arrows clear of the card's own tap target. */}
                <VoteControl
                    score={feedback.score}
                    viewerVote={feedback.viewer_vote}
                    // You cannot vote for your own suggestion, and a resolved one is settled.
                    disabled={settled || feedback.viewer_is_author}
                    onVote={onVote}
                />

                <View style={{ flex: 1 }}>
                    <Text
                        numberOfLines={2}
                        style={{
                            ...typography.body,
                            fontWeight: "600",
                            color: colors.textPrimary,
                            // Clears whichever marker holds the top corner.
                            paddingRight: isNew ? NEW_FLAG_WIDTH : AGE_WIDTH,
                        }}
                    >
                        {feedback.title}
                    </Text>

                    <View style={{
                        flexDirection: "row", alignItems: "center",
                        gap: spacing.sm, marginTop: spacing.xs,
                        // Clears the reply count in the corner below, which on a
                        // single-line card sits level with this row.
                        paddingRight: REPLY_COUNT_WIDTH,
                    }}>
                        <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                            {feedback.author_name}
                        </Text>
                        {status.tag && (
                            <Text style={{
                                ...typography.small, color: status.color,
                                fontWeight: "700", letterSpacing: 0.5,
                            }}>
                                {status.tag}
                            </Text>
                        )}
                    </View>
                </View>
            </View>

            {/* Always shown, zero included: an empty count is what tells you the
                suggestion has had no discussion yet, which is worth knowing. */}
            <View style={{
                position: "absolute",
                right: spacing.lg, bottom: spacing.md,
                flexDirection: "row", alignItems: "center", gap: 3,
            }}>
                <MaterialCommunityIcons name="comment-outline" size={16} color={colors.textMuted} />
                <Text style={{ ...typography.caption, color: colors.textMuted }}>
                    {feedback.comment_count}
                </Text>
            </View>

            {/* One corner, one marker. Everything in the new section is hours old, so the
                age there would only repeat what the flag already says. */}
            {isNew ? (
                <View style={{
                    position: "absolute",
                    top: 0, right: 0,
                    paddingVertical: 3, paddingHorizontal: spacing.sm,
                    backgroundColor: colors.danger,
                    // Square into the card's own corner, rounded on the inner one.
                    borderTopRightRadius: 13,
                    borderBottomLeftRadius: 8,
                }}>
                    <Text style={{
                        ...typography.small,
                        fontWeight: "700",
                        letterSpacing: 0.5,
                        color: colors.textPrimary,
                    }}>
                        NEW
                    </Text>
                </View>
            ) : (
                <Text style={{
                    position: "absolute",
                    top: spacing.md, right: spacing.lg,
                    ...typography.small,
                    color: colors.textMuted,
                }}>
                    {relativeTime(feedback.created_at)}
                </Text>
            )}
        </Pressable>
    )
}
