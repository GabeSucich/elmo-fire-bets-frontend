import React, { useEffect, useState } from "react"
import { Pressable, ScrollView, Text, View } from "react-native"
import { SeasonPickKind, SeasonPickResponseData, WeeksProgressRequestData } from "@/api"
import AppModal from "@/components/reusable/AppModal"
import ActionButton from "@/components/reusable/ActionButton"
import DismissKeyboardBackdrop from "@/components/reusable/DismissKeyboardBackdrop"
import NumericInput from "@/components/reusable/NumericInput"
import OverlayLoader from "@/components/reusable/OverlayLoader"
import { colors, shadows, spacing, typography } from "@/theme/colors"
import TeamLogo from "@/components/reusable/TeamLogo"

type Props = {
    visible: boolean
    pick: SeasonPickResponseData | null
    latestOpenWeek: number
    saving: boolean
    onClose: () => void
    onSave: (body: WeeksProgressRequestData) => void
}

/** Team weeks are a result, not a stat: a win is worth 1, a tie counts as half. */
const TEAM_RESULTS: { label: string, value: number, color: string }[] = [
    { label: "W", value: 1, color: colors.success },
    { label: "L", value: 0, color: colors.danger },
    { label: "T", value: 0.5, color: colors.warning },
]

type WeekDraft = {
    played: boolean
    /** Kept as text so a half-typed number does not get coerced mid-edit. */
    value: string
}

type Drafts = Record<number, WeekDraft>

function draftsFrom(pick: SeasonPickResponseData | null, openThrough: number): Drafts {
    const drafts: Drafts = {}
    for (let week = 1; week <= openThrough; week++) {
        const existing = pick?.progress.weeks.find(w => w.week === week)
        drafts[week] = {
            played: existing ? existing.played : true,
            value: existing?.value != null ? String(existing.value) : "",
        }
    }
    return drafts
}

export default function WeekProgressModal(props: Props) {
    const pick = props.pick
    const [drafts, setDrafts] = useState<Drafts>({})

    useEffect(() => {
        if (props.visible) setDrafts(draftsFrom(pick, props.latestOpenWeek))
    }, [props.visible, pick, props.latestOpenWeek])

    if (!pick) return null

    const teamWins = pick.kind === SeasonPickKind.TEAM_WINS
    // Newest first: the week you are here to fill in is almost always the latest one.
    const weeks = Array.from({ length: props.latestOpenWeek }, (_, i) => props.latestOpenWeek - i)

    function setDraft(week: number, patch: Partial<WeekDraft>) {
        setDrafts(d => ({ ...d, [week]: { ...d[week], ...patch } }))
    }

    function save() {
        // Only weeks with something in them are sent: a blank row means "not yet", which
        // the server would reject as a played week with no value.
        const entries = weeks
            .map(week => ({ week, ...drafts[week] }))
            .filter(d => !d.played || d.value !== "")
            .map(d => ({ week: d.week, played: d.played, value: d.played ? Number(d.value) : null }))
            .filter(d => d.value === null || !isNaN(d.value))
        props.onSave({ weeks: entries })
    }

    return (
        <AppModal visible={props.visible} animationType="fade" transparent onRequestClose={props.onClose}>
            <DismissKeyboardBackdrop style={{
                flex: 1, justifyContent: "center", alignItems: "center",
                backgroundColor: colors.overlay, padding: spacing.lg,
            }}>
                <View style={{
                    width: "100%", maxHeight: "85%",
                    backgroundColor: colors.backgroundSecondary, borderRadius: 20,
                    padding: spacing.xl, borderWidth: 1, borderColor: colors.cardBorder,
                    gap: spacing.md, ...shadows.modal,
                }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                        <TeamLogo team={pick.prop_bet_target.team_name} size={26} />
                        <View style={{ flexShrink: 1 }}>
                            <Text style={{ ...typography.heading, color: colors.textPrimary }}>
                                {pick.target_name}
                            </Text>
                            <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                                {teamWins ? "Wins" : pick.prop_type} · {pick.direction} {pick.line}
                            </Text>
                        </View>
                    </View>

                    {props.latestOpenWeek > 0 && (
                        <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled">
                            {weeks.map(week => {
                                const draft = drafts[week] ?? { played: true, value: "" }
                                return (
                                    <View key={week} style={{
                                        flexDirection: "row", alignItems: "center",
                                        gap: spacing.sm, paddingVertical: spacing.sm,
                                        borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
                                    }}>
                                        <Text style={{
                                            ...typography.body, color: colors.textSecondary,
                                            fontWeight: "600", width: 52,
                                        }}>
                                            Wk {week}
                                        </Text>

                                        {teamWins ? (
                                            <View style={{ flexDirection: "row", gap: spacing.xs, flex: 1 }}>
                                                {TEAM_RESULTS.map(r => {
                                                    const selected = draft.played && draft.value === String(r.value)
                                                    return (
                                                        <Pressable
                                                            key={r.label}
                                                            onPress={() => setDraft(week, { played: true, value: String(r.value) })}
                                                            style={{
                                                                paddingVertical: spacing.xs, paddingHorizontal: spacing.md,
                                                                borderRadius: 14, borderWidth: 1,
                                                                borderColor: selected ? r.color : colors.cardBorder,
                                                                backgroundColor: selected ? r.color : colors.card,
                                                            }}
                                                        >
                                                            <Text style={{
                                                                ...typography.caption, fontWeight: "700",
                                                                color: selected ? colors.textPrimary : colors.textSecondary,
                                                            }}>
                                                                {r.label}
                                                            </Text>
                                                        </Pressable>
                                                    )
                                                })}
                                            </View>
                                        ) : (
                                            <NumericInput
                                                value={draft.played ? draft.value : ""}
                                                editable={draft.played}
                                                onChangeText={t => setDraft(week, { played: true, value: t })}
                                                placeholder="—"
                                                style={{
                                                    flex: 1, borderWidth: 1, borderColor: colors.inputBorder,
                                                    borderRadius: 8, paddingHorizontal: spacing.sm,
                                                    paddingVertical: spacing.xs, color: colors.textPrimary,
                                                    backgroundColor: colors.inputBackground,
                                                }}
                                            />
                                        )}

                                        {/* Byes have to be recordable, or a missing week is
                                            indistinguishable from one nobody got round to. */}
                                        <Pressable
                                            onPress={() => setDraft(week, { played: !draft.played, value: "" })}
                                            style={{
                                                paddingVertical: spacing.xs, paddingHorizontal: spacing.sm,
                                                borderRadius: 14, borderWidth: 1,
                                                borderColor: draft.played ? colors.cardBorder : colors.accent,
                                                backgroundColor: draft.played ? colors.card : colors.accentDark,
                                            }}
                                        >
                                            <Text style={{
                                                ...typography.caption,
                                                color: draft.played ? colors.textMuted : colors.textPrimary,
                                                fontWeight: "600",
                                            }}>
                                                Bye
                                            </Text>
                                        </Pressable>
                                    </View>
                                )
                            })}
                        </ScrollView>
                    )}

                    <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: spacing.md }}>
                        <ActionButton text="Cancel" onPress={props.onClose} color={colors.buttonSecondary} />
                        <ActionButton
                            text="Save"
                            onPress={save}
                            color={props.saving || props.latestOpenWeek === 0
                                ? colors.buttonSecondary : colors.accent}
                        />
                    </View>

                    {props.saving && <OverlayLoader loaderProps={{ size: 24 }} />}
                </View>
            </DismissKeyboardBackdrop>
        </AppModal>
    )
}
