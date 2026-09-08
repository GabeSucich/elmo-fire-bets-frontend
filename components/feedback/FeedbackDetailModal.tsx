import React, { useEffect, useState } from "react"
import {
    Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, View,
} from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { FeedbackResponseData, FeedbackStatus } from "@/api"
import AppModal from "@/components/reusable/AppModal"
import OverlayLoader from "@/components/reusable/OverlayLoader"
import IconAction from "@/components/reusable/IconAction"
import CommentThread from "@/components/comments/CommentThread"
import ConfirmDelete from "@/components/comments/ConfirmDelete"
import { useFeedbackComments, useFeedbackVoters } from "@/composables/useFeedback"
import { relativeTime } from "@/util/relativeTime"
import { colors, shadows, spacing, typography } from "@/theme/colors"
import VoteControl, { VoteDirection } from "./VoteControl"
import { STATUS_STYLE, isSettled } from "./status"

type Props = {
    feedback: FeedbackResponseData | null
    viewerIsAdmin: boolean
    /** True while the list is writing to this suggestion — a vote, a resolve, an edit. */
    saving: boolean
    onClose: () => void
    onEdit: () => void
    onDelete: () => void
    onVote: (direction: VoteDirection) => void
    onSetStatus: (status: FeedbackStatus) => void
    /** Keeps the card's reply count right without re-fetching the list. */
    onCommentCount: (count: number) => void
}

function StatusChip({ label, icon, color, onPress }: {
    label: string, icon: string, color: string, onPress: () => void
}) {
    return (
        <Pressable
            onPress={onPress}
            hitSlop={8}
            accessibilityRole="button"
            style={{
                flexDirection: "row", alignItems: "center", gap: spacing.xs,
                paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
                borderRadius: 14, borderWidth: 1, borderColor: color,
            }}
        >
            <MaterialCommunityIcons name={icon} size={14} color={color} />
            <Text style={{ ...typography.caption, color }}>{label}</Text>
        </Pressable>
    )
}

/**
 * Who voted which way.
 *
 * The arrows carry the direction in colour, the same green and red the app uses for a
 * win and a loss everywhere else, so the two rows are told apart at a glance rather than
 * by reading which way a small grey triangle points.
 */
function VoterRow({ icon, color, names }: { icon: string, color: string, names: string[] }) {
    if (names.length === 0) return null

    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <MaterialCommunityIcons name={icon} size={20} color={color} />
            <Text style={{ ...typography.body, color: colors.textSecondary, flex: 1 }}>
                {names.join(", ")}
            </Text>
        </View>
    )
}

/**
 * One suggestion in full, with its replies.
 *
 * Replies are fetched here rather than with the list, and a reply refreshes only them —
 * the card behind this keeps its count, which is corrected from the length.
 */
export default function FeedbackDetailModal(props: Props) {
    const { feedback, viewerIsAdmin } = props
    const comments = useFeedbackComments(feedback?.id ?? null)
    // Re-fetched when the tally moves, so the names never disagree with the number.
    const { voters } = useFeedbackVoters(feedback?.id ?? null, feedback?.score ?? 0)
    const [confirmingDelete, setConfirmingDelete] = useState(false)

    const status = STATUS_STYLE[feedback?.status ?? FeedbackStatus.OPEN]
    const readOnly = feedback ? isSettled(feedback.status) : false

    // The list is told the real count as soon as the replies are in, so the card is right
    // by the time this closes. Gated on the replies having actually arrived for *this*
    // suggestion — the empty array they start as would otherwise blank a good count. Also
    // keeps the count honest as replies stream in behind the open sheet.
    useEffect(() => {
        if (feedback && comments.loadedId === feedback.id) {
            props.onCommentCount(comments.comments.length)
        }
    }, [comments.comments.length, comments.loadedId]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        setConfirmingDelete(false)
    }, [feedback?.id])

    if (!feedback) return null

    return (
        <AppModal visible animationType="slide" transparent onRequestClose={props.onClose}>
            <KeyboardAvoidingView
                // The sheet sits on the bottom edge with the reply box at its foot, so
                // without this the keyboard covers the field the moment it is tapped.
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
            <View style={{ flex: 1, backgroundColor: colors.overlay }}>
                {/* Only the dim strip above the sheet dismisses the keyboard. The usual
                    backdrop wraps the whole sheet, and a touchable ancestor takes the pan
                    before the replies' scroll view can — which is why they would not
                    scroll. Nothing here closes the modal: losing a half-written reply to a
                    stray tap is worse than a stuck keyboard. */}
                <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss} accessible={false} />

                <View style={{
                    maxHeight: "88%",
                    backgroundColor: colors.backgroundSecondary,
                    borderTopLeftRadius: 20, borderTopRightRadius: 20,
                    borderWidth: 1, borderColor: colors.cardBorder,
                    padding: spacing.xl,
                    ...shadows.modal,
                }}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
                        <Text style={{ ...typography.heading, color: colors.textPrimary, flex: 1 }}>
                            {feedback.title}
                        </Text>
                        <IconAction
                            icon="close" label="Close" color={colors.textSecondary}
                            onPress={props.onClose}
                        />
                    </View>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs }}>
                        <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                            {feedback.author_name}
                        </Text>
                        <Text style={{ ...typography.small, color: colors.textMuted }}>
                            {relativeTime(feedback.created_at)}
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

                    <View style={{ marginTop: spacing.md }}>
                        <Text style={{ ...typography.body, color: colors.textPrimary, lineHeight: 20 }}>
                            {feedback.comment}
                        </Text>

                        {/* Two columns: who voted on the left, what you can do about it on
                            the right. Both stack to roughly the same height, so putting them
                            on separate rows only pushed the replies further down. */}
                        <View style={{
                            flexDirection: "row", alignItems: "flex-start",
                            gap: spacing.md, marginTop: spacing.lg,
                        }}>
                            {/* Who voted, rather than how many: the count is on the card,
                                and in a league this size the names are the interesting
                                part. A direction nobody took renders nothing. */}
                            <View style={{ flex: 1, gap: spacing.xs, paddingTop: spacing.xs }}>
                                {/* Above the names, which are the same votes counted out:
                                    you cast yours here and see yourself appear below. */}
                                <VoteControl
                                    score={feedback.score}
                                    viewerVote={feedback.viewer_vote}
                                    // Not on your own, and not on one already settled.
                                    disabled={readOnly || feedback.viewer_is_author}
                                    orientation="horizontal"
                                    onVote={props.onVote}
                                />
                                <VoterRow icon="menu-up" color={colors.success} names={voters.up} />
                                <VoterRow icon="menu-down" color={colors.danger} names={voters.down} />
                            </View>

                            {/* An even split, so four controls cannot crowd the names into
                                a strip one word wide. Past half the width they wrap. */}
                            <View style={{
                                flex: 1,
                                flexDirection: "row", alignItems: "center",
                                justifyContent: "flex-end",
                                flexWrap: "wrap", rowGap: spacing.sm, gap: spacing.md,
                            }}>
                                {confirmingDelete ? (
                                    <ConfirmDelete
                                        onConfirm={props.onDelete}
                                        onCancel={() => setConfirmingDelete(false)}
                                    />
                                ) : (
                                    <>
                                        {feedback.viewer_is_author && !readOnly && (
                                            <>
                                                <IconAction
                                                    icon="square-edit-outline" label="Edit suggestion"
                                                    color={colors.textSecondary} onPress={props.onEdit}
                                                />
                                                <IconAction
                                                    icon="trash-can-outline" label="Delete suggestion"
                                                    color={colors.danger}
                                                    onPress={() => setConfirmingDelete(true)}
                                                />
                                            </>
                                        )}
                                        {viewerIsAdmin && (readOnly ? (
                                            <StatusChip
                                                label="Reopen" icon="undo-variant" color={colors.accent}
                                                onPress={() => props.onSetStatus(FeedbackStatus.OPEN)}
                                            />
                                        ) : (
                                            <>
                                                <StatusChip
                                                    label="Resolve" icon="check" color={colors.success}
                                                    onPress={() => props.onSetStatus(FeedbackStatus.RESOLVED)}
                                                />
                                                {/* Retiring says this will not be done, which is
                                                    worth recording — otherwise the same request
                                                    comes back every season. */}
                                                <StatusChip
                                                    label="Retire" icon="archive-outline" color={colors.textMuted}
                                                    onPress={() => props.onSetStatus(FeedbackStatus.RETIRED)}
                                                />
                                            </>
                                        ))}
                                    </>
                                )}
                            </View>
                        </View>

                    </View>

                    {/* Kept out of the scroll area, so it still says how many there are
                        once you have scrolled down among them.

                        From the card's own count, which the effect above keeps in step —
                        the loaded replies would read "0 replies" until the fetch lands.
                        Dropped entirely at zero: the reply box below is invitation enough. */}
                    {feedback.comment_count > 0 && (
                        <Text style={{
                            ...typography.caption, color: colors.textSecondary,
                            textTransform: "uppercase", letterSpacing: 0.5,
                            marginTop: spacing.lg,
                        }}>
                            {feedback.comment_count === 1 ? "1 reply" : `${feedback.comment_count} replies`}
                        </Text>
                    )}

                    {/* The only part that grows without bound, so it is the only part that
                        scrolls — and a scroll view only scrolls once something bounds its
                        height. flexShrink alone did not: the sheet's own cap clipped the
                        overflow instead of handing the replies a viewport to scroll inside.
                        A share of the window rather than a fixed number, so the same rule
                        holds on a small phone as on a large one. */}
                    <CommentThread
                        thread={comments}
                        targetId={feedback.id}
                        readOnly={readOnly}
                    />

                    {props.saving && <OverlayLoader loaderProps={{ size: 28 }} />}
                </View>
            </View>
            </KeyboardAvoidingView>
        </AppModal>
    )
}
