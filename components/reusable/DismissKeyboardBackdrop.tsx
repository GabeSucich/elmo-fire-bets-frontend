import React from "react"
import { Keyboard, Pressable, StyleProp, ViewStyle } from "react-native"

type Props = {
    style?: StyleProp<ViewStyle>
    children: React.ReactNode
}

/**
 * Modal backdrop that dismisses the keyboard when tapped.
 *
 * Number pads have no return key on iOS, so a focused field inside a modal otherwise
 * leaves the user with nowhere to tap. Deliberately does not close the modal: losing a
 * half-filled form to a stray tap is worse than a stuck keyboard.
 */
export default function DismissKeyboardBackdrop({ style, children }: Props) {
    return (
        <Pressable style={style} onPress={Keyboard.dismiss} accessible={false}>
            {children}
        </Pressable>
    )
}
