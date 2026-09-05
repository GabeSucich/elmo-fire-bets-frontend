import { PickResponseData, PropBetDirection, SauceFactor, VetoApprovalStatus } from "@/api";
import { colors, spacing } from "@/theme/colors";
import { getPickLine, PickDisplayUtil } from "@/util/picks";
import React from "react";
import { Text, View } from "react-native";
import { getSizeStyles, TileSize } from "../reusable/tiles/common";

type Props = {
    pick: PickResponseData
    showVeto?: boolean
    size?: TileSize
    /** Off where the surrounding layout already names who the bet is on. */
    showTarget?: boolean
}

/**
 * A pick, rendered as text rather than as chips.
 *
 * The bet the gambler took is the line and the market, so those lead; who it is on is
 * supporting detail and sits underneath, muted. Colour is spent only on the direction
 * caret, which is the one thing here that a colour can actually encode — the chips this
 * replaced coloured the target and the market too, and `betTypeToColor` returned the same
 * blue for every market, so most of that weight carried nothing.
 */
export default function PickDisplay({ pick, showVeto = true, size = "sm", showTarget = true }: Props) {
    const { fontSize } = getSizeStyles(size)
    const { directionDisplay } = PickDisplayUtil.lineAndDirectionDisplay(pick, showVeto)

    const isOver = directionDisplay === PropBetDirection.OVER
    const vetoed = showVeto && pick.veto?.approval_status === VetoApprovalStatus.APPROVED

    const sauce = pick.sauce_factor === SauceFactor.SPICY ? ' 🌶️'
        : pick.sauce_factor === SauceFactor.BITCH ? ' 💩'
        : ''

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            flexWrap: 'wrap',
            paddingVertical: spacing.xs,
        }}>
            <Text style={{
                color: isOver ? colors.success : colors.danger,
                fontSize: fontSize + 3,
                marginRight: spacing.xs,
            }}>{isOver ? '▲' : '▼'}</Text>
            <Text style={{
                color: colors.textPrimary,
                fontSize: fontSize + 4,
                fontWeight: '700',
                marginRight: spacing.sm,
            }}>{getPickLine(pick).toFixed(1)}{sauce}</Text>
            <Text style={{
                color: colors.textSecondary,
                fontSize: fontSize + 2,
                marginRight: spacing.sm,
            }}>{pick.prop_type}</Text>
            {showTarget && (
                <Text style={{
                    color: colors.textMuted,
                    fontSize: fontSize + 1,
                    marginRight: spacing.sm,
                }}>· {PickDisplayUtil.playerTeamDisplay(pick)}</Text>
            )}
            {/* The displayed direction is the flip of what was recorded, so say so. */}
            {vetoed && (
                <Text style={{
                    color: colors.textMuted,
                    fontSize,
                    fontStyle: 'italic',
                }}>vetoed</Text>
            )}
        </View>
    )
}
