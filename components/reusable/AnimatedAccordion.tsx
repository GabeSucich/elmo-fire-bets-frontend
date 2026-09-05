import React, { useState } from "react"
import { View } from "react-native"
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated"
import { colors } from "@/theme/colors"

type Props = {
    header: (toggle: () => void, open: boolean) => React.ReactNode
    children: React.ReactNode
}

export default function AnimatedAccordion({ header, children }: Props) {
    const [open, setOpen] = useState(false)
    const [contentHeight, setContentHeight] = useState(0)
    const animatedHeight = useSharedValue(0)

    const animatedStyle = useAnimatedStyle(() => ({
        height: animatedHeight.value,
        overflow: 'hidden' as const,
    }))

    function toggle() {
        const next = !open
        setOpen(next)
        animatedHeight.value = withTiming(next ? contentHeight : 0, { duration: 250 })
    }

    function onContentLayout(e: { nativeEvent: { layout: { height: number } } }) {
        const h = e.nativeEvent.layout.height
        if (h > 0 && h !== contentHeight) {
            setContentHeight(h)
            if (open) {
                animatedHeight.value = h
            }
        }
    }

    return (
        <>
            {header(toggle, open)}
            <Animated.View style={animatedStyle}>
                <View
                    style={{ position: 'absolute', opacity: 0 }}
                    onLayout={onContentLayout}
                >
                    {children}
                </View>
                {children}
            </Animated.View>
        </>
    )
}
