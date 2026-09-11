import { ReactElement } from "react"
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native"
import { colors, spacing } from "@/theme/colors"

type TabSize = "sm" | "md" | "lg"

type TabColorProps = {
    backgroundColor?: string
    activeBackgroundColor?: string
    textColor?: string
    activeTextColor?: string
    borderColor?: string
    activeBorderColor?: string
}

interface Props<T> {
    tabs: T[]
    activeTab: T,
    setActiveTab: (t: T) => void,
    getKey: (t: T) => string,
    getDisplay: (t: T) => ReactElement | string
    size?: TabSize
    colorProps?: TabColorProps | ((tab: T) => TabColorProps)
}

const sizeStyles = {
    sm: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 12, borderRadius: 14 },
    md: { paddingVertical: 8, paddingHorizontal: 16, fontSize: 14, borderRadius: 20 },
    lg: { paddingVertical: 12, paddingHorizontal: 22, fontSize: 16, borderRadius: 26 },
} as const

export default function TabButtons<T>({
    tabs,
    activeTab,
    setActiveTab,
    getKey,
    getDisplay,
    size = "md",
    colorProps
}: Props<T>) {
    const { paddingVertical, paddingHorizontal, fontSize, borderRadius } = sizeStyles[size]
    const isActive = (tab: T) => activeTab === tab
    const resolveColors = (tab: T) => typeof colorProps === 'function' ? colorProps(tab) : colorProps

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0 }} contentContainerStyle={styles.tabRow}>
            {tabs.map((tab) => {
                const customColors = resolveColors(tab)
                return (
                    <TouchableOpacity
                        key={getKey(tab)}
                        style={[
                            styles.tabButton,
                            { paddingVertical, paddingHorizontal, borderRadius },
                            customColors?.backgroundColor && { backgroundColor: customColors.backgroundColor },
                            customColors?.borderColor && { borderColor: customColors.borderColor },
                            isActive(tab) && styles.tabButtonActive,
                            isActive(tab) && customColors?.activeBackgroundColor && { backgroundColor: customColors.activeBackgroundColor },
                            isActive(tab) && customColors?.activeBorderColor && { borderColor: customColors.activeBorderColor },
                        ]}
                        onPress={() => setActiveTab(tab)}
                        activeOpacity={0.7}
                    >
                        <Text style={[
                            styles.tabText,
                            { fontSize },
                            customColors?.textColor && { color: customColors.textColor },
                            isActive(tab) && styles.tabTextActive,
                            isActive(tab) && customColors?.activeTextColor && { color: customColors.activeTextColor },
                        ]}>
                            {getDisplay(tab)}
                        </Text>
                    </TouchableOpacity>
                )
            })}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    tabRow: {
        flexDirection: "row",
        gap: spacing.sm,
        padding: spacing.md,
    },
    tabButton: {
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.cardBorder,
    },
    tabButtonActive: {
        backgroundColor: colors.accent,
        borderColor: colors.accent,
    },
    tabText: {
        color: colors.textSecondary,
        fontWeight: "500",
    },
    tabTextActive: {
        color: colors.textPrimary,
    },
})
