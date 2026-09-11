import React, { useEffect, useState } from "react"
import { Text, View } from "react-native"
import { ParlayResponseData } from "@/api"
import AppModal from "@/components/reusable/AppModal"
import ActionButton from "@/components/reusable/ActionButton"
import DismissKeyboardBackdrop from "@/components/reusable/DismissKeyboardBackdrop"
import NumericInput from "@/components/reusable/NumericInput"
import TabButtons from "@/components/reusable/TabButtons"
import { money, perPerson } from "@/util/payout"
import { colors, shadows, spacing, typography } from "@/theme/colors"

const MODES = ["Total", "Per person"] as const
type Mode = typeof MODES[number]

type Props = {
    visible: boolean
    parlay: ParlayResponseData
    saving?: boolean
    /** Shown above the field when the lay cannot be finalized without one. */
    prompt?: string
    onClose: () => void
    /** Always the per-person, stake-inclusive figure, whichever way it was typed. */
    onSave: (payoutPerPerson: number) => void
}

/**
 * Entering what a lay pays.
 *
 * Two ways in on purpose. A slip prints the whole return, so that is what somebody
 * copying one off their phone has in front of them; but the number everybody talks about
 * is their own share, so that has to be typeable too. Either way what gets stored is the
 * per-person figure, divided by the legs on the lay and rounded to the cent.
 */
export default function PayoutEditorModal(props: Props) {
    const pickCount = props.parlay.picks.length
    const [mode, setMode] = useState<Mode>("Total")
    const [value, setValue] = useState("")

    useEffect(() => {
        if (!props.visible) return
        setMode("Total")
        // Seeded from what is already stored, which is per person — so the field opens on
        // the total that would produce it rather than on an empty box.
        setValue(props.parlay.payout_pp === null
            ? ""
            : String(Math.round(props.parlay.payout_pp * pickCount * 100) / 100))
    }, [props.visible, props.parlay.payout_pp, pickCount])

    const typed = Number(value)
    const valid = value !== "" && !isNaN(typed) && typed > 0
    const stored = !valid ? null : mode === "Total" ? perPerson(typed, pickCount) : typed

    return (
        <AppModal visible={props.visible} animationType="fade" transparent onRequestClose={props.onClose}>
            <DismissKeyboardBackdrop style={{
                flex: 1, justifyContent: "center", alignItems: "center",
                backgroundColor: colors.overlay, padding: spacing.lg,
            }}>
                <View style={{
                    width: "100%", backgroundColor: colors.backgroundSecondary,
                    borderRadius: 20, padding: spacing.xl, gap: spacing.md,
                    borderWidth: 1, borderColor: colors.cardBorder, ...shadows.modal,
                }}>
                    <Text style={{ ...typography.heading, color: colors.textPrimary }}>
                        Payout
                    </Text>
                    {props.prompt && (
                        <Text style={{ ...typography.caption, color: colors.warning }}>
                            {props.prompt}
                        </Text>
                    )}
                    <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                        What the lay pays out if it lands, with the wager included — the
                        figure the slip prints.
                    </Text>

                    <TabButtons<Mode>
                        tabs={[...MODES]}
                        activeTab={mode}
                        setActiveTab={setMode}
                        getKey={m => m}
                        getDisplay={m => m}
                        size="sm"
                    />

                    <NumericInput
                        value={value}
                        onChangeText={setValue}
                        placeholder={mode === "Total" ? "470.00" : "94.00"}
                        style={{
                            borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 8,
                            paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                            color: colors.textPrimary, backgroundColor: colors.inputBackground,
                            ...typography.body,
                        }}
                    />

                    {/* The arithmetic, shown rather than implied: entering a total silently
                        divided by a leg count you cannot see is how the wrong number gets
                        saved without anybody noticing. */}
                    <Text style={{ ...typography.caption, color: colors.textMuted }}>
                        {stored === null
                            ? `Divided by ${pickCount} pick${pickCount === 1 ? "" : "s"}`
                            : mode === "Total"
                                ? `${money(typed)} ÷ ${pickCount} = ${money(stored)} each`
                                : `${money(stored)} each × ${pickCount} = ${money(stored * pickCount)}`}
                    </Text>

                    <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: spacing.md }}>
                        <ActionButton text="Cancel" onPress={props.onClose} color={colors.buttonSecondary} />
                        <ActionButton
                            text="Save"
                            onPress={() => stored !== null && props.onSave(stored)}
                            disabled={stored === null}
                            loading={props.saving}
                        />
                    </View>
                </View>
            </DismissKeyboardBackdrop>
        </AppModal>
    )
}
