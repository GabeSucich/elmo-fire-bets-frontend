import React, { useState } from "react"
import { Pressable, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import AppModal from "@/components/reusable/AppModal"
import { useAuthContext } from "@/contexts/authContext"
import { colors, shadows, spacing, typography } from "@/theme/colors"

type Props = {
    onAllSeasons: () => void
}

type MenuItem = {
    label: string
    icon: string
    onPress: () => void
    destructive?: boolean
}

/** Roughly the height of a native stack header, used to drop the menu just below it. */
const HEADER_HEIGHT = 44

const ICON_SIZE = 26
/** Wider than the glyph: an icon font's advance width is not its font size, so a box sized
 *  exactly to ICON_SIZE leaves centring nothing to distribute and the mark sits off to one
 *  side. */
const TOUCH_SIZE = 34

/**
 * The season header's menu.
 *
 * A chevron implied "up one step" when the action actually leaves the season, and a text
 * button sat there reading like a second title. A menu also gives account-level actions
 * somewhere to live, which is where logging out belongs.
 */
export default function SeasonHeaderMenu({ onAllSeasons }: Props) {
    const [open, setOpen] = useState(false)
    const insets = useSafeAreaInsets()
    const { logout } = useAuthContext()

    const items: MenuItem[] = [
        { label: "All seasons", icon: "format-list-bulleted", onPress: onAllSeasons },
        { label: "Log out", icon: "logout", onPress: logout, destructive: true },
    ]

    function choose(action: () => void) {
        setOpen(false)
        action()
    }

    return (
        <>
            {/* A square larger than the glyph, with the glyph centred in it. Without the
                box the mark is laid out on a text baseline and sits high in the capsule iOS 26
                draws around header buttons; without the extra width it sits off to one side,
                since the font's advance width does not match its point size. */}
            <Pressable
                onPress={() => setOpen(true)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Menu"
                style={{
                    width: TOUCH_SIZE,
                    height: TOUCH_SIZE,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <MaterialCommunityIcons
                    name="menu"
                    size={ICON_SIZE}
                    color={colors.accent}
                    style={{ lineHeight: ICON_SIZE, textAlign: "center", width: ICON_SIZE }}
                />
            </Pressable>

            <AppModal
                visible={open}
                animationType="fade"
                transparent
                onRequestClose={() => setOpen(false)}
            >
                {/* Tapping anywhere outside closes it, which is what a menu of this size
                    should do rather than demanding a second deliberate tap. */}
                <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)}>
                    <View style={{
                        position: "absolute",
                        top: insets.top + HEADER_HEIGHT,
                        right: spacing.md,
                        minWidth: 180,
                        backgroundColor: colors.backgroundSecondary,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                        paddingVertical: spacing.xs,
                        ...shadows.modal,
                    }}>
                        {items.map(item => (
                            <Pressable
                                key={item.label}
                                onPress={() => choose(item.onPress)}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: spacing.sm,
                                    paddingVertical: spacing.md,
                                    paddingHorizontal: spacing.lg,
                                }}
                            >
                                <MaterialCommunityIcons
                                    name={item.icon}
                                    size={18}
                                    color={item.destructive ? colors.danger : colors.textSecondary}
                                />
                                <Text style={{
                                    ...typography.body,
                                    color: item.destructive ? colors.danger : colors.textPrimary,
                                }}>
                                    {item.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </Pressable>
            </AppModal>
        </>
    )
}
