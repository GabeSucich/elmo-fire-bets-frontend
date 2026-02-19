import { ReactElement, SetStateAction } from "react"
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native"

type TabSize = "sm" | "md" | "lg"

type TabColorProps = {
    backgroundColor?: string
    activeBackgroundColor?: string
    textColor?: string
    activeTextColor?: string
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
    sm: { paddingVertical: 4, paddingHorizontal: 10, fontSize: 12, borderRadius: 14 },
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
                const colors = resolveColors(tab)
                return (
                    <TouchableOpacity
                        key={getKey(tab)}
                        style={[
                            styles.tabButton,
                            { paddingVertical, paddingHorizontal, borderRadius },
                            colors?.backgroundColor && { backgroundColor: colors.backgroundColor },
                            isActive(tab) && styles.tabButtonActive,
                            isActive(tab) && colors?.activeBackgroundColor && { backgroundColor: colors.activeBackgroundColor },
                        ]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[
                            styles.tabText,
                            { fontSize },
                            colors?.textColor && { color: colors.textColor },
                            isActive(tab) && styles.tabTextActive,
                            isActive(tab) && colors?.activeTextColor && { color: colors.activeTextColor },
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
        gap: 8,
        padding: 12,
    },
    tabButton: {
        backgroundColor: "#e0e0e0",
    },
    tabButtonActive: {
        backgroundColor: "#007AFF",
    },
    tabText: {
        color: "#666",
        fontWeight: "500",
    },
    tabTextActive: {
        color: "#fff",
    },
})