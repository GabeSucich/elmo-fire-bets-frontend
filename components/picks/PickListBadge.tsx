import React, { useEffect, useRef, useState } from "react"
import { Animated, Pressable, Text, TouchableOpacity, View } from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { PickListPlacementResponseData } from "@/api"
import AppModal from "@/components/reusable/AppModal"
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import { PICK_LIST_DISPLAY, describeNarrowing } from "@/util/pickLists"
import { colors, shadows, spacing, typography } from "@/theme/colors"

type Props = {
    placement: PickListPlacementResponseData
    /** What the pick is on, for the drawer's accessibility label. */
    targetName: string
}

const PULSES = 3
const PULSE_MS = 320
const PULSE_SCALE = 1.45
/**
 * A beat before it starts.
 *
 * The badge mounts in the middle of a list laying itself out, which is the busiest moment
 * the screen has — starting on that frame means the pulse competes with rows still
 * arriving and is mostly over before anything is settled enough to look at.
 */
const PULSE_DELAY_MS = 250

/**
 * The mark on a pick that lands on one of the season's lists, with how many people put it
 * there.
 *
 * Just the mark and a number, sitting with the player it is about — a parlay can carry one
 * of these per leg, and labelled banners stacked down a card drown out the picks
 * themselves. Whose entry it is, and what exactly they wrote down, is one tap away.
 */
export default function PickListBadge({ placement, targetName }: Props) {
    const { gamblers } = useGamblingSeasonContext()
    const [visible, setVisible] = useState(false)

    const display = PICK_LIST_DISPLAY[placement.list_type]
    const count = placement.entries.length

    // The core Animated API on the native driver rather than reanimated: once started it
    // runs entirely off the JS thread, with nothing computed per frame in JavaScript.
    const scale = useRef(new Animated.Value(1)).current

    // On mount, every mount. Suppressing repeats needs somewhere to remember what has
    // already pulsed, and everything that unmounts these — switching parlay tabs, the
    // list virtualising, the tab this screen opens on being decided after the first
    // render — burns that memory on a frame nobody was looking at, so the mark ends up
    // announcing itself exactly once and never when anybody is watching.
    useEffect(() => {
        // Fresh timings per beat: an Animated animation is single-use, so a sequence built
        // from reused instances plays once and then sits still.
        const beat = () => [
            Animated.timing(scale, {
                toValue: PULSE_SCALE, duration: PULSE_MS / 2, useNativeDriver: true,
            }),
            Animated.timing(scale, {
                toValue: 1, duration: PULSE_MS / 2, useNativeDriver: true,
            }),
        ]
        const animation = Animated.sequence(
            Array.from({ length: PULSES }).flatMap(beat)
        )
        // A plain timer rather than Animated.delay in the sequence, which takes no driver
        // flag of its own and would put a JS-driven step in front of native-driven ones.
        const timer = setTimeout(() => animation.start(), PULSE_DELAY_MS)
        return () => {
            clearTimeout(timer)
            // The list is virtualised, so a badge can be unmounted mid-pulse.
            animation.stop()
        }
    }, [scale])

    return (
        <>
            <TouchableOpacity
                onPress={() => setVisible(true)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`${targetName} is on ${count} ${placement.display_name} ${count === 1 ? "entry" : "entries"}`}
                activeOpacity={0.7}
            >
                <Animated.View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 2,
                    transform: [{ scale }],
                }}>
                    <MaterialCommunityIcons name={display.icon} size={16} color={display.color} />
                    <Text style={{
                        ...typography.small,
                        color: display.color,
                        fontWeight: "700",
                    }}>{count}</Text>
                </Animated.View>
            </TouchableOpacity>

            {/* Mounted only once it is wanted, like PickThreadModal in the same slot. A
                Modal is a real native view even at visible={false}, and AppModal puts a
                ToastHost inside each one — so an always-mounted drawer here is another of
                those on every pick that happens to be on somebody's list, paid again every
                time the parlay list is rebuilt. */}
            {visible && <AppModal
                visible={visible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setVisible(false)}
            >
                <Pressable
                    onPress={() => setVisible(false)}
                    style={{
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: colors.overlay,
                        padding: spacing.xl,
                    }}
                >
                    {/* No title. Each row names the list it is, so a heading above them
                        only repeated the player's name back at somebody who just tapped
                        the mark beside it. */}
                    <View style={{
                        width: "100%",
                        backgroundColor: colors.backgroundSecondary,
                        borderRadius: 20,
                        padding: spacing.lg,
                        borderWidth: 1,
                        borderColor: display.color,
                        gap: spacing.sm,
                        ...shadows.modal,
                    }}>
                        {placement.entries.map(entry => (
                            <View
                                key={entry.gambler_id}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: spacing.sm,
                                }}
                            >
                                <MaterialCommunityIcons
                                    name={display.icon} size={16} color={display.color}
                                />
                                <Text style={{
                                    ...typography.body,
                                    color: colors.textPrimary,
                                    fontWeight: "600",
                                    flexShrink: 1,
                                }}>
                                    {`${gamblers[entry.gambler_id]?.firstName ?? "Unknown"}’s ${placement.display_name}`}
                                </Text>
                                {/* What exactly they wrote down, not just that they did:
                                    "Rec Yards · Over" is the difference between an entry
                                    that describes this bet and one that describes the
                                    player in general. */}
                                <Text style={{
                                    ...typography.caption,
                                    color: colors.textSecondary,
                                    marginLeft: "auto",
                                }}>
                                    {describeNarrowing(entry)}
                                </Text>
                            </View>
                        ))}
                    </View>
                </Pressable>
            </AppModal>}
        </>
    )
}
