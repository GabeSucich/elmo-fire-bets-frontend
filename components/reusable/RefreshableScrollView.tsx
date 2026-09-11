import React from "react"
import { RefreshControl, ScrollView, ScrollViewProps } from "react-native"
import { colors } from "@/theme/colors"

type Props = ScrollViewProps & {
    onRefresh: () => void
    /**
     * Whether a fetch is in flight. Passed in rather than timed internally so the spinner
     * lasts exactly as long as the request does — a fixed delay either lies about a slow
     * load or leaves a fast one flickering.
     */
    refreshing: boolean
    children: React.ReactNode
}

/**
 * A scrolling tab you can pull down to reload.
 *
 * One wrapper rather than a RefreshControl on each screen: every analytics tab wants the
 * same gesture and the same tint, and four copies would drift.
 */
export default function RefreshableScrollView({ onRefresh, refreshing, children, ...rest }: Props) {
    return (
        <ScrollView
            {...rest}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.accent}
                    colors={[colors.accent]}
                />
            }
        >
            {children}
        </ScrollView>
    )
}
