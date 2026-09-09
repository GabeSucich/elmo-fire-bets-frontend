import React, { useRef } from "react"
import { GestureResponderEvent, Pressable, StyleProp, Text, View, ViewStyle } from "react-native"
import { TileSize, TileStyleProps, extractStyleProps } from "./common"
import { colors } from "@/theme/colors"

/** How far a finger may travel and still count as a tap rather than the start of a scroll. */
const TAP_SLOP = 10

type Props<T> = {
    item: T
    isSelected: boolean
    display: string | ((t: T) => string)
    handleSelect: (t: T) => void
    handleUnselect?: (t: T) => void
    tileStyles?: Partial<TileStyleProps>
    style?: StyleProp<ViewStyle>
    size?: TileSize
}

export default function SelectableTile<T>(props: Props<T>) {
    const {
        primaryColor,
        borderRadius,
        paddingHorizontal,
        paddingVertical,
        marginRight,
        fontSize
    } = extractStyleProps(props.tileStyles, props.size)

    // Where the finger went down, so a drag can be told from a tap.
    const touchStart = useRef<{ x: number, y: number } | null>(null)

    function handlePress() {
        if (props.isSelected && props.handleUnselect) {
            props.handleUnselect(props.item)
        } else if (!props.isSelected) {
            props.handleSelect(props.item)
        }
    }

    return (
        <Pressable
            // Pressable rather than TouchableOpacity purely because its props carry the raw
            // touch handlers through to the underlying View; the press feedback below is
            // best-effort and simply does not fire in the case this exists to work around.
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            // Selection is driven from raw touch events rather than onPress.
            //
            // With a keyboard up, the press gesture is terminated before Pressability can
            // resolve it, so onPress and onPressIn never fire and a chip cannot be chosen
            // until the keyboard is dismissed — the same problem the reply send button had.
            // Raw touch events are not part of that negotiation and still arrive.
            //
            // onTouchStart alone would be wrong here though: these chips sit in a
            // horizontal scroller, so firing on touch-down would select whatever was under
            // your finger every time you tried to scroll. Comparing the end position to the
            // start is what separates a tap from a drag — and if the ScrollView claims the
            // gesture for a scroll, onTouchEnd does not arrive at all, which is exactly the
            // outcome wanted.
            onTouchStart={(e: GestureResponderEvent) => {
                touchStart.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }
            }}
            onTouchEnd={(e: GestureResponderEvent) => {
                const start = touchStart.current
                touchStart.current = null
                if (!start) return
                const moved = Math.abs(e.nativeEvent.pageX - start.x) > TAP_SLOP
                    || Math.abs(e.nativeEvent.pageY - start.y) > TAP_SLOP
                if (!moved) handlePress()
            }}
        >
            <View style={[props.style, {
                backgroundColor: props.isSelected ? primaryColor : colors.card,
                borderColor: props.isSelected ? primaryColor : colors.cardBorder,
                borderWidth: 1,
                borderRadius,
                paddingHorizontal,
                paddingVertical,
                marginRight
            }]}>
                <Text
                    style={{
                        color: props.isSelected ? colors.textPrimary : colors.textSecondary,
                        fontSize,
                        fontWeight: '500',
                    }}
                >
                    { props.display instanceof Function ? props.display(props.item) : props.display }
                </Text>
            </View>
        </Pressable>
    )
}
