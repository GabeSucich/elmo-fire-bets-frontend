import { PickResponseData, PropBetDirection, SauceFactor, VetoApprovalStatus } from "@/api";
import { colors, spacing } from "@/theme/colors";
import { getPickLine, PickDisplayUtil } from "@/util/picks";
import React from "react";
import { Text, View } from "react-native";
import { getSizeStyles, TileSize } from "../reusable/tiles/common";

/**
 * The size the market text is drawn at.
 *
 * Exported so a label sitting beside a pick can match it without hardcoding a number that
 * would quietly drift. Note the default: PickDisplay falls back to "sm" while getSizeStyles
 * falls back to "md", so callers must go through this rather than calling getSizeStyles
 * with an undefined size and getting a different answer.
 */
export function pickMarketFontSize(size: TileSize = "sm") {
    return getSizeStyles(size).fontSize + 2
}

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

    const sauce = pick.sauce_factor === SauceFactor.SPICY ? '🌶️'
        : pick.sauce_factor === SauceFactor.BITCH ? '💩'
        : ''

    return (
        <View style={{
            flexDirection: 'row',
            // Centred, not baseline-aligned. Baseline reads better for mixed sizes and was
            // right while this was only text, but the sauce emoji has a far taller ascent
            // than the digits: sharing a baseline with it pushes that baseline down the box,
            // stranding the text in the lower half while the box's centre stays high. Every
            // label centred against this box — the gambler's name beside it — then lines up
            // with empty space rather than with the bet. Centring makes the box's centre and
            // the text's centre the same point, whatever the emoji does to the height.
            alignItems: 'center',
            flexWrap: 'wrap',
            paddingVertical: spacing.xs,
        }}>
            {/* First where it is shown at all. On a veto card this is the thing being
                argued about, and trailing it behind the line buried the one detail the
                reader is checking. Sized with the market rather than under it, for the
                same reason. */}
            {showTarget && (
                <Text style={{
                    color: colors.textMuted,
                    fontSize: pickMarketFontSize(size),
                    marginRight: spacing.sm,
                }}>{PickDisplayUtil.playerTeamDisplay(pick)} ·</Text>
            )}
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
            }}>{getPickLine(pick).toFixed(1)}</Text>
            <Text style={{
                color: colors.textSecondary,
                fontSize: pickMarketFontSize(size),
                marginRight: spacing.sm,
            }}>{pick.prop_type}</Text>
            {/* After the market rather than fused to the number: it qualifies the bet as a
                whole, not the line, and hanging it off the digits made "0.5🌶️" read as one
                token. Its own Text so an emoji's taller metrics inflate only this box and
                not the bold line beside it. */}
            {sauce !== '' && (
                <Text style={{
                    fontSize: fontSize + 2,
                    marginRight: spacing.sm,
                }}>{sauce}</Text>
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
