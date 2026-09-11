import React, { useEffect, useState } from "react"
import { View } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"

type Props = {
    expanded: boolean
    duration?: number
    children: React.ReactNode
}

/**
 * Slides a section open and shut, driven by a prop rather than its own state.
 *
 * The height is measured from a copy laid out absolutely, out of flow: a section that
 * starts collapsed has its container clipped to zero height, and content measured inside
 * that reports nothing to animate towards — which left closed parlays expanding to an
 * empty card. The copy is mounted only until the first measurement lands, so unlike
 * `AnimatedAccordion` the children are not permanently double-mounted.
 *
 * Children stay mounted while collapsed — this hides them, it does not unmount them.
 */
export default function Collapsible({ expanded, duration = 250, children }: Props) {
    const [contentHeight, setContentHeight] = useState<number | null>(null)
    const progress = useSharedValue(expanded ? 1 : 0)

    useEffect(() => {
        progress.value = withTiming(expanded ? 1 : 0, { duration })
    }, [expanded, duration, progress])

    const animatedStyle = useAnimatedStyle(() => {
        // Before the first measurement there is nothing to animate towards, so sit at the
        // resting state. Height only ever goes from this to a number, never back to auto,
        // which an animated style would not reliably clear.
        if (contentHeight === null) {
            return {
                height: expanded ? undefined : 0,
                opacity: expanded ? 1 : 0,
                overflow: 'hidden' as const,
            }
        }
        return {
            height: contentHeight * progress.value,
            opacity: progress.value,
            overflow: 'hidden' as const,
        }
    }, [contentHeight, expanded])

    return (
        <Animated.View style={animatedStyle}>
            {contentHeight === null && (
                <View
                    style={{ position: 'absolute', left: 0, right: 0, opacity: 0 }}
                    pointerEvents="none"
                    onLayout={event => {
                        const height = event.nativeEvent.layout.height
                        if (height > 0) setContentHeight(height)
                    }}
                >
                    {children}
                </View>
            )}
            {/* Keep the height current once open — a result landing or a veto chip
                appearing changes it, and a stale value clips or leaves a gap. While
                collapsed this reports the clipped height, so it is ignored. */}
            <View
                onLayout={event => {
                    const height = event.nativeEvent.layout.height
                    if (expanded && height > 0 && height !== contentHeight) {
                        setContentHeight(height)
                    }
                }}
            >
                {children}
            </View>
        </Animated.View>
    )
}
