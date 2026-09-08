import React, { useEffect, useRef, useState } from "react"
import { Keyboard, Text, TextInput, View } from "react-native"
import { FeedbackResponseData } from "@/api"
import ActionButton from "@/components/reusable/ActionButton"
import AppModal from "@/components/reusable/AppModal"
import DismissKeyboardBackdrop from "@/components/reusable/DismissKeyboardBackdrop"
import OverlayLoader from "@/components/reusable/OverlayLoader"
import { MAX_TITLE_LENGTH } from "./feedbackText"
import { colors, shadows, spacing, typography } from "@/theme/colors"

type Props = {
    visible: boolean
    /** Set when editing an existing suggestion; null when raising a new one. */
    feedback: FeedbackResponseData | null
    saving: boolean
    onClose: () => void
    onSubmit: (body: { title?: string, comment: string }) => void
}

function Label({ children }: { children: React.ReactNode }) {
    return (
        <Text style={{
            ...typography.caption,
            color: colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: spacing.xs,
        }}>
            {children}
        </Text>
    )
}

const inputStyle = {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    backgroundColor: colors.inputBackground,
    ...typography.body,
}

/**
 * Raising a suggestion asks for the suggestion and nothing else — a title is written for you from
 * what you wrote. It only becomes a field once the suggestion exists, so it can be corrected
 * when the generated one misses.
 */
export default function FeedbackComposerModal({ visible, feedback, saving, onClose, onSubmit }: Props) {
    const [title, setTitle] = useState("")
    const [comment, setComment] = useState("")
    const titleInput = useRef<TextInput>(null)
    const commentInput = useRef<TextInput>(null)

    /**
     * Blurs the fields themselves rather than calling Keyboard.dismiss alone.
     *
     * A Modal is presented in its own window, and Keyboard.dismiss acts on the app's main
     * one — so from in here it can do nothing at all, which is why submitting left the
     * keyboard standing over the list after the modal had gone. Blurring the node reaches
     * the actual first responder wherever it lives. dismiss() stays as a backstop for a
     * field that never took a ref.
     */
    function releaseKeyboard() {
        titleInput.current?.blur()
        commentInput.current?.blur()
        Keyboard.dismiss()
    }

    // Reset on open so a new suggestion never inherits the last one's half-written text.
    useEffect(() => {
        if (!visible) return
        setTitle(feedback?.title ?? "")
        setComment(feedback?.comment ?? "")
    }, [visible, feedback])

    const editing = feedback !== null
    const ready = comment.trim().length > 0 && (!editing || title.trim().length > 0)

    function submit() {
        if (!ready) return
        // Released explicitly, because nothing else here does it. The field keeps focus
        // right up until the modal unmounts, and a keyboard whose input has gone is left
        // standing over the list behind it. The pick drawer only avoids this by accident —
        // its send runs off a raw touch, which blurs the field on the way through.
        releaseKeyboard()
        onSubmit(editing
            ? { title: title.trim(), comment: comment.trim() }
            : { comment: comment.trim() })
    }

    /** Same reason as submit: leaving by any door should take the keyboard with it. */
    function close() {
        releaseKeyboard()
        onClose()
    }

    return (
        <AppModal visible={visible} animationType="fade" transparent onRequestClose={close}>
            <DismissKeyboardBackdrop style={{
                flex: 1, justifyContent: "center", alignItems: "center",
                backgroundColor: colors.overlay, padding: spacing.lg,
            }}>
                <View style={{
                    width: "100%",
                    backgroundColor: colors.backgroundSecondary,
                    borderRadius: 20, padding: spacing.xl,
                    borderWidth: 1, borderColor: colors.cardBorder,
                    gap: spacing.md,
                    ...shadows.modal,
                }}>
                    <Text style={{
                        ...typography.heading,
                        // A prompt rather than a label, so it sits a step below a title.
                        fontSize: 14,
                        color: colors.textPrimary,
                    }}>
                        {editing ? "Edit suggestion" : "What could be better?"}
                    </Text>

                    {editing && (
                        <View>
                            <Label>Title</Label>
                            <TextInput
                                ref={titleInput}
                                value={title}
                                onChangeText={setTitle}
                                maxLength={MAX_TITLE_LENGTH}
                                placeholder="Short summary"
                                placeholderTextColor={colors.textMuted}
                                style={inputStyle}
                            />
                        </View>
                    )}

                    <View>
                        {/* Only worth labelling when it shares the modal with the title
                            field; on its own the placeholder says it. */}
                        {editing && <Label>Details</Label>}
                        <TextInput
                            ref={commentInput}
                            value={comment}
                            onChangeText={setComment}
                            placeholder="Describe your suggestion for new features or improvements"
                            placeholderTextColor={colors.textMuted}
                            multiline
                            textAlignVertical="top"
                            autoFocus={!editing}
                            style={{ ...inputStyle, minHeight: 120 }}
                        />
                    </View>

                    <View style={{
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: spacing.md,
                        marginTop: spacing.sm,
                    }}>
                        <ActionButton text="Cancel" onPress={close} color={colors.buttonSecondary} />
                        <ActionButton
                            text={editing ? "Save" : "Submit"}
                            onPress={submit}
                            color={ready ? colors.accent : colors.buttonSecondary}
                            disabled={!ready}
                        />
                    </View>

                    {saving && <OverlayLoader loaderProps={{ size: 28, text: "Saving..." }} />}
                </View>
            </DismissKeyboardBackdrop>
        </AppModal>
    )
}
