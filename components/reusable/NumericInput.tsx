import React from "react"
import { TextInput, TextInputProps } from "react-native"
import { colors } from "@/theme/colors"

/**
 * A number field with the app's keyboard and placeholder defaults.
 *
 * iOS number pads have no return key, so these cannot be dismissed from the keyboard
 * itself — modals containing one wrap their backdrop in DismissKeyboardBackdrop, and
 * tapping outside the field closes it.
 */
export default function NumericInput(props: TextInputProps) {
    return (
        <TextInput
            keyboardType="decimal-pad"
            placeholderTextColor={colors.textMuted}
            {...props}
        />
    )
}
