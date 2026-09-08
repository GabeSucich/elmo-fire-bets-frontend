import { SauceFactor } from "@/api"
import { ReviewRowState } from "@/composables/useCorrectionImageAnalysis"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { ACTION_ICON_SIZE, colors, spacing, typography } from "@/theme/colors"
import { playerTeamDisplay } from "@/util/executePlayerSearch"
import { PickDisplayUtil, SAUCE_EMOJI } from "@/util/picks"
import { Pressable, Text, TextInput, TouchableOpacity, View } from "react-native"

type Props = {
    row: ReviewRowState
    onChangeValue: (value: string) => void
    onEditFully: () => void
    /** null clears the designation; the row keeps its own value so the full editor is not needed. */
    onChangeSauce: (next: SauceFactor | null) => void
}

/**
 * One gambler's line as it will be submitted.
 *
 * Three shapes. Normally the row proposes a number against the stored line and lets it be
 * edited in place — including for picks the slip said nothing about, which arrive holding
 * their own line so that confirming them as already correct means submitting unchanged.
 * Once a pick has been overridden by hand the proposed-correction framing no longer
 * applies, so the row shows the override itself. And a gambler with no pick at all has
 * nothing to correct, so the row asks for one to be added.
 */
const SAUCE_OPTIONS: { factor: SauceFactor, color: string }[] = [
    { factor: SauceFactor.SPICY, color: colors.danger },
    { factor: SauceFactor.BITCH, color: colors.warning },
]

function SauceToggle({ value, onChange }: {
    value: SauceFactor | null
    onChange: (next: SauceFactor) => void
}) {
    return (
        <View style={{ flexDirection: "row", gap: spacing.xs }}>
            {SAUCE_OPTIONS.map(option => {
                const selected = value === option.factor
                return (
                    <Pressable
                        key={option.factor}
                        onPress={() => onChange(option.factor)}
                        hitSlop={6}
                        accessibilityLabel={`${selected ? "Remove" : "Mark"} ${option.factor}`}
                        style={{
                            paddingHorizontal: spacing.sm,
                            paddingVertical: spacing.xs,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: selected ? option.color : colors.cardBorder,
                            backgroundColor: selected ? option.color : "transparent",
                            opacity: selected ? 1 : 0.5,
                        }}
                    >
                        <Text style={{ fontSize: 13 }}>{SAUCE_EMOJI[option.factor]}</Text>
                    </Pressable>
                )
            })}
        </View>
    )
}

export default function CorrectionReviewRow({ row, onChangeValue, onEditFully, onChangeSauce }: Props) {
    const { pick, leg, gamblerName, edit } = row
    // The row's own change wins, then a staged full edit, then whatever is stored.
    const sauce = row.sauceFactor !== undefined
        ? row.sauceFactor
        : edit ? edit.sauceFactor : pick?.sauce_factor ?? null
    const stored = pick ? PickDisplayUtil.lineAndDirectionDisplay(pick, true) : null

    const targetDisplay = edit
        ? playerTeamDisplay(edit.playerTeamResult)
        : pick ? PickDisplayUtil.playerTeamDisplay(pick) : null
    const propTypeDisplay = edit?.propType ?? pick?.prop_type ?? null
    const directionDisplay = edit?.direction ?? stored?.directionDisplay

    const missingPick = !pick && !edit
    const invalid = !!pick && !edit && Number.isNaN(parseFloat(row.value))

    const borderColor = invalid || missingPick
        ? (missingPick ? colors.buttonSecondary : colors.danger)
        : edit ? colors.accent : leg ? colors.cardBorder : colors.buttonSecondary

    return (
        <View style={{
            borderWidth: 1,
            borderColor,
            borderRadius: 8,
            padding: spacing.sm,
            gap: spacing.xs,
        }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                    {gamblerName}
                </Text>
                {/* The same pencil the parlay card uses for editing, so the affordance means
                    one thing across the app. A row with no pick still needs words: an icon
                    cannot say "there is nothing here yet". */}
                <TouchableOpacity
                    onPress={onEditFully}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={pick || edit ? `Edit ${gamblerName}'s pick` : `Add a pick for ${gamblerName}`}
                >
                    {pick || edit ? (
                        <MaterialCommunityIcons
                            name="square-edit-outline"
                            size={ACTION_ICON_SIZE}
                            color={colors.accent}
                        />
                    ) : (
                        <Text style={{ ...typography.caption, color: colors.accent, fontWeight: '600' }}>
                            Add pick
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {targetDisplay && (
                <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                    {targetDisplay} · {propTypeDisplay}
                </Text>
            )}

            {missingPick ? (
                <Text style={{ ...typography.caption, color: colors.textSecondary, fontStyle: 'italic' }}>
                    No pick was recorded for this parlay. Add one before applying.
                </Text>
            ) : edit ? (
                <>
                    <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: '600' }}>
                        {directionDisplay} {row.value}
                    </Text>
                    <Text style={{ ...typography.caption, color: colors.accent, fontStyle: 'italic' }}>
                        {pick ? "Manual override" : "New pick"} — saved with the rest on submit.
                    </Text>
                </>
            ) : (
                <>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                        <Text style={{ ...typography.body, color: colors.textSecondary }}>{stored?.lineDisplay}</Text>
                        <Text style={{ color: colors.textSecondary }}>→</Text>
                        <Text style={{ ...typography.body, color: colors.textSecondary }}>{directionDisplay}</Text>
                        <TextInput
                            value={row.value}
                            onChangeText={onChangeValue}
                            keyboardType="decimal-pad"
                            selectTextOnFocus={true}
                            style={{
                                ...typography.body,
                                color: colors.textPrimary,
                                borderWidth: 1,
                                borderColor: invalid ? colors.danger : colors.cardBorder,
                                borderRadius: 6,
                                paddingHorizontal: spacing.sm,
                                paddingVertical: spacing.xs,
                                minWidth: 72,
                                textAlign: 'center',
                            }}
                        />
                    </View>

                    {leg ? (
                        <Text style={{ ...typography.caption, color: colors.textSecondary, fontStyle: 'italic' }}>
                            from slip: {leg.raw_text}
                        </Text>
                    ) : (
                        <Text style={{ ...typography.caption, color: colors.textSecondary, fontStyle: 'italic' }}>
                            {row.note ?? 'No line on the slip matched this pick.'} Its own line will be kept unless you change it.
                        </Text>
                    )}

                    {row.looseTargetMatch && (
                        <Text style={{ ...typography.caption, color: colors.warning, fontWeight: '600' }}>
                            ⚠ The slip names {leg?.player_name ?? 'a player'} but this pick is on {pick?.prop_bet_target.team_name}.
                        </Text>
                    )}

                    {row.directionMismatch && (
                        <Text style={{ ...typography.caption, color: colors.warning, fontWeight: '600' }}>
                            ⚠ The slip shows {leg?.direction} but this pick is {directionDisplay}. This might be a veto — the direction will not be changed.
                        </Text>
                    )}
                </>
            )}

            {!missingPick && (
                /* Shown on edited rows too: the staged summary says nothing about sauce, so
                   without this an override would hide whether a pick is designated. */
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                    <SauceToggle
                        value={sauce}
                        onChange={next => onChangeSauce(sauce === next ? null : next)}
                    />
                </View>
            )}
        </View>
    )
}
