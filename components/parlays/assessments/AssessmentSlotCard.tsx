import { AssessmentSlotData, AssessmentSuggestionData, PickResponseData, SignalStrength, SlotStatus } from "@/api"
import PickDisplay from "@/components/picks/PickDisplay"
import TeamLogo from "@/components/reusable/TeamLogo"
import { colors, spacing, typography } from "@/theme/colors"
import React, { useEffect, useState } from "react"
import { Pressable, Text, View } from "react-native"
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"

const TOGGLE_DURATION = 250

/** How strongly the data argues against the pick, as the model rated it: the bar's colour. */
const SIGNAL_COLOR: Record<SignalStrength, string> = {
    [SignalStrength.HIGH]: colors.danger,
    [SignalStrength.MEDIUM]: colors.warning,
    [SignalStrength.LOW]: colors.textMuted,
}

type Props = {
    slot: AssessmentSlotData
    /** Why the slot reads the way it does — only ever set for a stale one. */
    notice: string | null
    /** The pick this is about, drawn as the parlay draws it. Absent for the whole slate. */
    pick?: PickResponseData
    gamblerName?: string
}

/**
 * One pick's analysis, or the slate's. Only shown when there is something to say.
 *
 * The pick is drawn the way the parlay card draws it — logo, player, the line with its
 * direction arrow — so it reads as the same bet. Each concern is a title on its own, and
 * opens to its explanation when tapped: a slate's worth of paragraphs at once was a wall.
 *
 * Not built on Collapsible, which opens to a height it measures from a hidden copy: in
 * this modal that measurement came back empty and the explanation opened to nothing. The
 * explanation is mounted on tap instead, and the layout transitions here animate the card
 * — and the cards below it — to its new height without anything having to be measured.
 */
export default function AssessmentSlotCard({ slot, notice, pick, gamblerName }: Props) {
    return (
        <Animated.View layout={LinearTransition.duration(TOGGLE_DURATION)} style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.cardBorder,
            padding: spacing.md,
            marginBottom: spacing.md,
            gap: spacing.sm,
        }}>
            {pick ? <PickHeader pick={pick} gamblerName={gamblerName} /> : (
                <Text style={{ ...typography.heading, color: colors.textPrimary }}>Parlay alerts</Text>
            )}

            {notice && (
                <Text style={{
                    ...typography.caption,
                    fontStyle: 'italic',
                    color: slot.status === SlotStatus.STALE ? colors.warning : colors.textSecondary,
                }}>{notice}</Text>
            )}

            {slot.suggestions.map((suggestion, i) => (
                <SuggestionRow key={i} suggestion={suggestion} />
            ))}
        </Animated.View>
    )
}

/** The same leading row a parlay slot draws: whose team, who, and the bet itself. */
function PickHeader({ pick, gamblerName }: { pick: PickResponseData, gamblerName?: string }) {
    const target = pick.prop_bet_target
    return (
        <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TeamLogo team={target.team_name} size={20} />
                <Text style={{
                    color: colors.textPrimary, ...typography.body,
                    fontWeight: '600', flexShrink: 1, marginLeft: spacing.xs,
                }}>
                    {target.player_name ?? target.team_name}
                </Text>
                {gamblerName && (
                    <Text style={{ ...typography.caption, color: colors.textSecondary, marginLeft: 'auto' }}>
                        {gamblerName}
                    </Text>
                )}
            </View>
            <View style={{ marginTop: spacing.xs }}>
                <PickDisplay pick={pick} showTarget={false} />
            </View>
        </View>
    )
}


function SuggestionRow({ suggestion }: { suggestion: AssessmentSuggestionData }) {
    const [expanded, setExpanded] = useState(false)
    const signalColor = suggestion.signal ? SIGNAL_COLOR[suggestion.signal] : null
    const rotation = useSharedValue(0)

    useEffect(() => {
        rotation.value = withTiming(expanded ? 180 : 0, { duration: TOGGLE_DURATION })
    }, [expanded, rotation])

    const chevronStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }],
    }))

    return (
        <Animated.View
            layout={LinearTransition.duration(TOGGLE_DURATION)}
            // Concerns from before signals existed keep the old red bar.
            style={{ borderLeftWidth: 3, borderLeftColor: signalColor ?? colors.danger, paddingLeft: spacing.sm }}
        >
            <Pressable
                onPress={() => setExpanded(e => !e)}
                style={{ flexDirection: 'row', alignItems: 'center' }}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
            >
                <Text style={{ ...typography.body, fontWeight: '600', color: colors.textPrimary, flex: 1 }}>
                    {suggestion.title}
                </Text>
                <Animated.View style={[{ marginLeft: spacing.sm }, chevronStyle]}>
                    <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
                </Animated.View>
            </Pressable>
            {/* The explanation opens on tap; the title stands alone until then. The signal is
                never written out — the accent bar's colour carries it. The model still tags
                each concern (ConcernTag); it is simply not shown for now. */}
            {expanded && (
                <Animated.View
                    entering={FadeIn.duration(TOGGLE_DURATION)}
                    exiting={FadeOut.duration(TOGGLE_DURATION / 2)}
                    style={{ paddingTop: spacing.xs }}
                >
                    <Text style={{ ...typography.body, color: colors.textSecondary }}>
                        {suggestion.description}
                    </Text>
                </Animated.View>
            )}
        </Animated.View>
    )
}
