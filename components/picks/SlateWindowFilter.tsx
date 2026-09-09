import React, { useRef, useState } from "react"
import { Pressable, Text, View } from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import Popover, { PopoverAnchor } from "@/components/reusable/Popover"
import { SLATE_WINDOWS, SlateWindow } from "@/composables/useSlateLines"
import { colors, spacing, typography } from "@/theme/colors"

/** The unfiltered option. Reads as "All games" because that is what the counts beside
 *  every option are measured in. */
const ALL = "All games"

type Props = {
    value: SlateWindow | null
    /** How many games kick off in each window. Windows absent from this are not offered. */
    counts: Map<SlateWindow, number>
    total: number
    onChange: (value: SlateWindow | null) => void
}

/**
 * Narrows a slate to one part of the day.
 *
 * A dropdown rather than a row of chips: four windows plus a clear is more than fits
 * comfortably beside the search box, and this is a filter you set once and forget rather
 * than something you toggle repeatedly.
 */
export default function SlateWindowFilter({ value, counts, total, onChange }: Props) {
    const [anchor, setAnchor] = useState<PopoverAnchor | null>(null)
    const button = useRef<View>(null)

    // Only windows this slate actually has. Offering "Evening 0" is a menu item whose only
    // outcome is an empty list — the absence says it better than a zero does.
    const options: (SlateWindow | null)[] = [
        null,
        ...SLATE_WINDOWS.filter(w => (counts.get(w) ?? 0) > 0),
    ]

    function pick(next: SlateWindow | null) {
        setAnchor(null)
        onChange(next)
    }

    return (
        <>
            <Pressable
                ref={button}
                onPress={() => button.current?.measureInWindow((x, y, width, height) =>
                    setAnchor({ x, y, width, height })
                )}
                accessibilityRole="button"
                accessibilityLabel="Filter by kickoff time"
                style={{
                    flexDirection: "row", alignItems: "center", gap: spacing.xs,
                    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                    borderRadius: 10, borderWidth: 1,
                    // Set filters look set: an outline in the accent is the difference
                    // between "no filter" and "a filter that happens to match everything".
                    borderColor: value ? colors.accent : colors.cardBorder,
                }}
            >
                <MaterialCommunityIcons
                    name="clock-outline"
                    size={15}
                    color={value ? colors.accent : colors.textMuted}
                />
                <Text style={{
                    ...typography.caption,
                    color: value ? colors.accent : colors.textSecondary,
                    fontWeight: "600",
                }}>
                    {value ?? ALL}
                </Text>
                {/* Clearing without reopening the menu — the common way out of a filter is
                    straight back to everything. */}
                {value ? (
                    <Pressable onPress={() => onChange(null)} hitSlop={8}>
                        <MaterialCommunityIcons name="close" size={15} color={colors.textSecondary} />
                    </Pressable>
                ) : (
                    <MaterialCommunityIcons name="chevron-down" size={15} color={colors.textMuted} />
                )}
            </Pressable>

            <Popover anchor={anchor} onClose={() => setAnchor(null)}>
                <View style={{ minWidth: 190 }}>
                    {options.map(option => {
                        const selected = option === value
                        const count = option === null ? total : (counts.get(option) ?? 0)
                        return (
                            <Pressable
                                key={option ?? ALL}
                                onPress={() => pick(option)}
                                style={{
                                    flexDirection: "row", alignItems: "center", gap: spacing.sm,
                                    paddingVertical: spacing.md, paddingHorizontal: spacing.sm,
                                }}
                            >
                                <Text style={{
                                    ...typography.body,
                                    color: selected ? colors.accent : colors.textPrimary,
                                    fontWeight: selected ? "600" : "400",
                                    flex: 1,
                                }}>
                                    {option ?? ALL}
                                </Text>
                                {/* No tick beside it: the accent already says which one is
                                    selected, and a second marker for the same fact only
                                    shifts the counts out of line with each other. */}
                                <Text style={{ ...typography.small, color: colors.textMuted }}>
                                    {count} {count === 1 ? "game" : "games"}
                                </Text>
                            </Pressable>
                        )
                    })}
                </View>
            </Popover>
        </>
    )
}
