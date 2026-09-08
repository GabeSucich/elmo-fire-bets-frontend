import React, { useState } from "react"
import { Pressable, View, useWindowDimensions } from "react-native"
import AppModal from "./AppModal"
import { colors, shadows, spacing } from "@/theme/colors"

/** Where the trigger sits on screen, from measureInWindow. */
export type PopoverAnchor = { x: number, y: number, width: number, height: number }

type Props = {
    /** The measured trigger, or null when closed. */
    anchor: PopoverAnchor | null
    onClose: () => void
    /**
     * Span the screen rather than sizing to the content.
     *
     * For content that scrolls sideways: a scroller has no natural width to be measured
     * from — it takes whatever it is given — so it needs to be told, and the widest it can
     * be is the least it has to scroll.
     */
    fillWidth?: boolean
    children: React.ReactNode
}

/** Kept clear of the screen edges, and of the trigger it points at. */
const SCREEN_MARGIN = spacing.md
const ANCHOR_GAP = spacing.xs

/**
 * Floats content over the app, anchored to something that has been measured.
 *
 * A Modal rather than an absolutely-positioned sibling, which is not a matter of taste
 * here: parlay cards render inside Collapsible, which clips to `overflow: hidden` and pins
 * the card to a measured content height. Anything positioned inside one is both cut off and
 * absent from the measurement that decides where the cut is.
 *
 * Costs nothing in layout — the content is out of flow entirely, so opening this never
 * resizes what is underneath.
 */
export default function Popover({ anchor, onClose, fillWidth = false, children }: Props) {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions()
    const [size, setSize] = useState<{ width: number, height: number } | null>(null)

    if (!anchor) return null

    // Below the trigger by default, above it when there is not room — the bar this opens
    // from sits low on a card more often than not.
    const below = size === null || anchor.y + anchor.height + ANCHOR_GAP + size.height < screenHeight - SCREEN_MARGIN
    const top = below
        ? anchor.y + anchor.height + ANCHOR_GAP
        : anchor.y - (size?.height ?? 0) - ANCHOR_GAP

    // Centred on the trigger, then pulled back inside the screen. A filling popover has
    // nowhere to be centred — it already occupies everything between the margins.
    const width = size?.width ?? 0
    const left = fillWidth ? SCREEN_MARGIN : Math.min(
        Math.max(anchor.x + anchor.width / 2 - width / 2, SCREEN_MARGIN),
        Math.max(screenWidth - width - SCREEN_MARGIN, SCREEN_MARGIN),
    )

    return (
        <AppModal visible animationType="fade" transparent onRequestClose={onClose}>
            {/* Transparent rather than dimmed: this is a small menu hanging off a control,
                not a sheet, and dimming the card behind it overstates what is happening.
                Anywhere outside dismisses. */}
            <Pressable style={{ flex: 1 }} onPress={onClose} accessible={false} />

            <View
                // Laid out once, invisibly, so it can be placed from its real size rather
                // than a guess — otherwise it lands wrong and visibly jumps into place.
                // Still needed when filling: the height decides whether it opens up or down.
                onLayout={event => {
                    const { width, height } = event.nativeEvent.layout
                    if (width !== size?.width || height !== size?.height) setSize({ width, height })
                }}
                style={{
                    position: "absolute",
                    top, left,
                    opacity: size === null ? 0 : 1,
                    ...(fillWidth
                        ? { width: screenWidth - SCREEN_MARGIN * 2 }
                        : { maxWidth: screenWidth - SCREEN_MARGIN * 2 }),
                    padding: spacing.sm,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                    backgroundColor: colors.backgroundSecondary,
                    ...shadows.modal,
                }}
            >
                {children}
            </View>
        </AppModal>
    )
}
