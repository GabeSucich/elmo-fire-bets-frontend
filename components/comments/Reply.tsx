import React, { useState } from "react"
import { Pressable, Text, TextInput, View } from "react-native"
import OverlayLoader from "@/components/reusable/OverlayLoader"
import IconAction from "@/components/reusable/IconAction"
import { ThreadComment } from "@/composables/useCommentThread"
import { relativeTime } from "@/util/relativeTime"
import { colors, spacing, typography } from "@/theme/colors"

type Props = {
    comment: ThreadComment
    readOnly: boolean
    pending: boolean
    onEdited: (text: string, done: () => void) => void
}

/** One reply in a thread, with an edit in place for its author. */
export default function Reply({ comment, readOnly, pending, onEdited }: Props) {
    const [editing, setEditing] = useState(false)
    const [text, setText] = useState(comment.comment)

    return (
        <View style={{
            paddingVertical: spacing.md,
            borderTopWidth: 1,
            borderTopColor: colors.divider,
        }}>
            {pending && <OverlayLoader loaderProps={{ size: 18 }} />}
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                <Text style={{ ...typography.caption, color: colors.textPrimary, fontWeight: "600" }}>
                    {comment.authorName}
                </Text>
                <Text style={{ ...typography.small, color: colors.textMuted }}>
                    {relativeTime(comment.createdAt)}
                </Text>
                <View style={{ flex: 1 }} />
                {/* Editable but not deletable: a reply someone has already answered
                    should not be able to vanish out from under the thread. */}
                {comment.viewerIsAuthor && !readOnly && !editing && (
                    <IconAction
                        icon="square-edit-outline" label="Edit reply"
                        color={colors.textSecondary}
                        onPress={() => { setText(comment.comment); setEditing(true) }}
                    />
                )}
            </View>

            {editing ? (
                <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
                    <TextInput
                        value={text}
                        onChangeText={setText}
                        multiline
                        textAlignVertical="top"
                        style={{
                            borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 10,
                            paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                            color: colors.textPrimary, backgroundColor: colors.inputBackground,
                            minHeight: 64, ...typography.body,
                        }}
                    />
                    <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: spacing.md }}>
                        <Pressable onPress={() => setEditing(false)} hitSlop={8}>
                            <Text style={{ ...typography.caption, color: colors.textSecondary }}>Cancel</Text>
                        </Pressable>
                        <Pressable
                            // Closed by the callback rather than here, so a failed save
                            // keeps the edit open with what was typed in it.
                            onPress={() => text.trim() && onEdited(text.trim(), () => setEditing(false))}
                            hitSlop={8}
                        >
                            <Text style={{ ...typography.caption, color: colors.accent, fontWeight: "600" }}>Save</Text>
                        </Pressable>
                    </View>
                </View>
            ) : (
                <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: spacing.xs }}>
                    {comment.comment}
                </Text>
            )}
        </View>
    )
}
