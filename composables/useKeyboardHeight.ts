import { useEffect, useState } from "react"
import { Keyboard, Platform } from "react-native"

/**
 * How much of the screen the keyboard is currently covering.
 *
 * Used in place of KeyboardAvoidingView inside a Modal. A Modal is a separate root view, and
 * KeyboardAvoidingView measures itself against the window — so inside one it can lift a
 * sheet by the wrong amount or not at all, leaving the controls at the sheet's foot sitting
 * outside their parent's bounds. A view outside its parent's bounds still draws on iOS but
 * stops receiving touches, which is how a send button ends up visible and unpressable while
 * the tap falls through to whatever is behind it.
 *
 * Measuring the keyboard directly and padding by it is deterministic: the number comes from
 * the event rather than from a layout pass that has to guess at the modal's geometry.
 *
 * `Will` events on iOS so the padding animates with the keyboard rather than a frame behind
 * it; Android only emits `Did`.
 */
export default function useKeyboardHeight(): number {
    const [height, setHeight] = useState(0)

    useEffect(() => {
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow"
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide"

        const show = Keyboard.addListener(showEvent, e => setHeight(e.endCoordinates.height))
        const hide = Keyboard.addListener(hideEvent, () => setHeight(0))
        return () => { show.remove(); hide.remove() }
    }, [])

    return height
}
