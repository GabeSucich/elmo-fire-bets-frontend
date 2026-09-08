import React, { useEffect, useRef, useState } from "react"
import {
    ActivityIndicator, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions,
} from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { ThreadController } from "@/composables/useCommentThread"
import { colors, spacing, typography } from "@/theme/colors"
import Reply from "./Reply"

/** How much of the screen the replies may take before they start scrolling. */
const REPLIES_MAX_SHARE = 0.38

type Props = {
    thread: ThreadController
    /** The target this thread belongs to, so the opening jump happens once per target. */
    targetId: number | null
    /** Settled feedback and closed parlays are a record: they show but do not take replies. */
    readOnly?: boolean
    /** Overrides the default share of the window the replies may occupy. */
    maxHeightShare?: number
    placeholder?: string
}

/**
 * A thread of replies and the box to add one, over any target.
 *
 * Knows nothing about what it hangs off — it is handed a ThreadController and renders it —
 * which is what lets a suggestion and a pick share one implementation rather than two that
 * drift.
 */
export default function CommentThread({
    thread, targetId, readOnly = false, maxHeightShare = REPLIES_MAX_SHARE, placeholder = "Add a reply",
}: Props) {
    const { height: windowHeight } = useWindowDimensions()
    const replies = useRef<ScrollView>(null)
    // Which target the opening jump has already been done for, so it happens once on the
    // way in and never again while you are reading.
    const jumpedFor = useRef<number | null>(null)
    // Armed when a reply of your own lands, so the next growth follows it down. Nothing
    // else arms it — which is what stops a polled reply from moving the view.
    const followNewReply = useRef(false)
    const [reply, setReply] = useState("")

    // A new reply is the one write with no row of its own; editing or deleting a reply
    // shows its spinner over that reply instead, so the send button stays still.
    const posting = thread.saving && thread.pendingId === null

    useEffect(() => {
        setReply("")
        jumpedFor.current = null
    }, [targetId])

    return (
        <>
            {/* The only part that grows without bound, so it is the only part that scrolls —
                and a scroll view only scrolls once something bounds its height. flexShrink
                alone did not: the sheet's own cap clipped the overflow instead of handing
                the replies a viewport to scroll inside. A share of the window rather than a
                fixed number, so the same rule holds on a small phone as on a large one. */}
            <ScrollView
                ref={replies}
                style={{ maxHeight: windowHeight * maxHeightShare }}
                contentContainerStyle={{ paddingBottom: spacing.md }}
                keyboardShouldPersistTaps="handled"
                // Opens at the newest reply. The thread runs oldest first, so landing at the
                // top of a long one shows the least current part of it. Unanimated: this is
                // where the drawer opens, not a journey.
                //
                // A reply that streamed in while you were reading arms nothing and finds the
                // jump already done, so it lands below the fold and the view stays put —
                // which is the whole point of streaming rather than refreshing.
                onContentSizeChange={() => {
                    if (targetId === null || thread.loadedId !== targetId) return
                    // Animated, unlike the opening jump: this one is a consequence of
                    // something you just did, and worth seeing happen.
                    if (followNewReply.current) {
                        followNewReply.current = false
                        replies.current?.scrollToEnd({ animated: true })
                        return
                    }
                    if (jumpedFor.current === targetId) return
                    jumpedFor.current = targetId
                    replies.current?.scrollToEnd({ animated: false })
                }}
            >
                {thread.loading && thread.comments.length === 0 && (
                    <ActivityIndicator
                        size="small" color={colors.accent}
                        style={{ marginTop: spacing.md }}
                    />
                )}

                {thread.comments.map(c => (
                    <Reply
                        key={c.id}
                        comment={c}
                        readOnly={readOnly}
                        pending={thread.pendingId === c.id}
                        onEdited={(text, done) => thread.update(c.id, text, done)}
                    />
                ))}
            </ScrollView>

            {!readOnly && (
                <View style={{
                    flexDirection: "row", alignItems: "flex-end",
                    gap: spacing.sm, marginTop: spacing.md,
                    borderTopWidth: 1, borderTopColor: colors.divider,
                    paddingTop: spacing.md,
                }}>
                    <TextInput
                        value={reply}
                        onChangeText={setReply}
                        placeholder={placeholder}
                        placeholderTextColor={colors.textMuted}
                        multiline
                        style={{
                            flex: 1, maxHeight: 100,
                            borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 10,
                            paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                            color: colors.textPrimary, backgroundColor: colors.inputBackground,
                            ...typography.body,
                        }}
                    />
                    <Pressable
                        // Cleared by the callback rather than here, so a failed post keeps
                        // the text in the box.
                        onPress={() => thread.create(reply.trim(), () => {
                            setReply("")
                            followNewReply.current = true
                        })}
                        disabled={!reply.trim() || posting}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Post reply"
                        style={{
                            width: 38, height: 38, borderRadius: 19,
                            alignItems: "center", justifyContent: "center",
                            backgroundColor: reply.trim() && !posting ? colors.accent : colors.buttonDisabled,
                        }}
                    >
                        {posting
                            ? <ActivityIndicator size="small" color={colors.textPrimary} />
                            : <MaterialCommunityIcons name="send" size={16} color={colors.textPrimary} />}
                    </Pressable>
                </View>
            )}
        </>
    )
}
