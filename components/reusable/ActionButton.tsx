import React from "react"
import { Text, TouchableOpacity, View } from "react-native"

type Props = {
    text: string
    onPress: () => void
    color?: string
    disabled?: boolean
    disabledColor?: string
}

export default function ActionButton({ text, onPress, color = '#3b82f6', disabled, disabledColor = '#4b5563' }: Props) {
    return (
        <TouchableOpacity onPress={onPress} disabled={disabled} style={{ opacity: disabled ? 0.4 : 1 }}>
            <View style={{ backgroundColor: disabled ? disabledColor : color, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 }}>
                <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>{text}</Text>
            </View>
        </TouchableOpacity>
    )
}
