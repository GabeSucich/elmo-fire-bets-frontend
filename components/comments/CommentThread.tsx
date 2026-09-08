import React, { useEffect, useRef, useState } from "react"
import {
    ActivityIndicator, Pressable, ScrollView, TextInput, View, useWindowDimensions,
} from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { ThreadController } from "@/composables/useCommentThread"
import { colors, spacing } from "@/theme/colors"
import Reply from "./Reply"

/** How much of the screen the replies may take before they start scrolling. */
const REPLIES_MAX_SHARE = 0.38
/** Comfortably past the 44pt minimum, and the field matches it so the row reads as one. */
const SEND_BUTTON_SIZE = 48

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
    const canSend = reply.trim().length > 0 && !posting

    function send() {
        if (!canSend) return
        const text = reply.trim()
        // Cleared here rather than from the success callback. The callback is threaded
        // through useWriteState and does not survive the re-render that dismissing the
        // keyboard causes, so the reply posted and the box kept its text.
        //
        // Put back if the post fails, which keeps the original guarantee: you never lose
        // what you typed to a failed request. Only overwritten if the box is still empty —
        // if you have started typing the next reply in the meantime, that wins.
        setReply("")
        thread.create(text, () => { followNewReply.current = true }, () => {
            setReply(current => (current.length === 0 ? text : current))
        })
    }

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
                // maxHeight caps it when there is room; flexShrink is what saves it when
                // there is not. The keyboard shrinks the sheet, but a maxHeight measured
                // off the *full* window does not shrink with it — so the replies kept
                // claiming 38% of a screen that was no longer there and pushed the composer
                // down under the keyboard, where its taps go to the keyboard rather than to
                // the button. Shrinking first means the composer is always the last thing
                // to lose space, so the send button stays reachable with the keyboard up.
                style={{ maxHeight: windowHeight * maxHeightShare, flexShrink: 1 }}
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
                            flex: 1, minHeight: SEND_BUTTON_SIZE, maxHeight: 120,
                            borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12,
                            paddingHorizontal: spacing.md, paddingVertical: spacing.md,
                            color: colors.textPrimary, backgroundColor: colors.inputBackground,
                            fontSize: 16,
                        }}
                    />
                    <Pressable
                        // Sent from the raw touch, not from a press handler.
                        //
                        // With the field focused, onTouchStart fires but onPressIn and
                        // onPress never do: the press gesture is terminated before
                        // Pressability can resolve it, so anything built on press semantics
                        // is simply unreachable while the keyboard is up. That is why
                        // sending took two taps — the first was spent losing focus, and only
                        // once the keyboard was gone could a press complete.
                        //
                        // The cost is that dragging off after touching down will not cancel.
                        // Guarded by hand rather than by `disabled`, since a raw touch
                        // handler still fires on a disabled Pressable.
                        onTouchStart={send}
                        disabled={!canSend}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Post reply"
                        style={{
                            width: SEND_BUTTON_SIZE, height: SEND_BUTTON_SIZE,
                            borderRadius: SEND_BUTTON_SIZE / 2,
                            alignItems: "center", justifyContent: "center",
                            backgroundColor: canSend ? colors.accent : colors.buttonDisabled,
                        }}
                    >
                        {posting
                            ? <ActivityIndicator size="small" color={colors.textPrimary} />
                            : <MaterialCommunityIcons name="send" size={22} color={colors.textPrimary} />}
                    </Pressable>
                </View>
            )}
        </>
    )
}
