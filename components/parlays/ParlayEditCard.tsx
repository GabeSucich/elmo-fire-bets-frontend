import { CreateParlayRequestData, ParlayResponseData, SlateType } from "@/api"
import { Gambler, useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import React, { useState, useMemo } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import SelectableTileGroup from "../reusable/tiles/SelectableTileGroup"
import NumericInput from "../reusable/NumericInput"
import { ParlayEditArgs } from "./common"
import { useToastContext } from "@/contexts/toastContext"
import { colors, shadows, typography, spacing } from "@/theme/colors"
import { parseSlateDate } from "@/util/slateDate";

type Props = {
    parlay?: ParlayResponseData
    handleEdit: (args: ParlayEditArgs) => void
}

export default function ParlayEditCard({ parlay, handleEdit }: Props) {
    const { sortedGamblers, gamblerId } = useGamblingSeasonContext()

    // Today, not null, for a new parlay. The picker renders `competitionDate ?? new Date()`,
    // so a null start showed today while holding nothing — leaving Create disabled until the
    // user tapped a date that was already on screen.
    const [competitionDate, setCompetitionDate] = useState<Date | null>(
        parseSlateDate(parlay?.competition_date) ?? new Date()
    )
    const [ownerId, setOwnerId] = useState<number | null>(
        parlay?.owner_id ?? gamblerId
    )
    const [slateType, setSlateType] = useState<SlateType | null>(
        parlay?.slate_type ?? null
    )
    const [wagerPp, setWagerPp] = useState<string>(
        parlay?.wager_pp != null ? String(parlay.wager_pp) : "5"
    )

    const { showToast } = useToastContext()

    const isEditing = !!parlay

    const parsedWager = parseFloat(wagerPp)
    const allFieldsFilled = competitionDate !== null && ownerId !== null && slateType !== null && wagerPp !== "" && !isNaN(parsedWager) && parsedWager > 0

    const hasChanges = useMemo(() => {
        if (!parlay) return false

        const dateChanged = competitionDate?.toISOString().split('T')[0] !== parlay.competition_date
        const ownerChanged = ownerId !== parlay.owner_id
        const slateChanged = slateType !== parlay.slate_type
        const wagerChanged = parlay.wager_pp != null ? parsedWager !== parlay.wager_pp : wagerPp !== ""

        return dateChanged || ownerChanged || slateChanged || wagerChanged
    }, [parlay, competitionDate, ownerId, slateType, parsedWager, wagerPp])

    const isButtonDisabled = isEditing ? (!hasChanges || !allFieldsFilled) : !allFieldsFilled

    function getEditArgs(): ParlayEditArgs | null {
        if (!competitionDate || !ownerId || !slateType || !allFieldsFilled) return null

        return {
            competitionDate: competitionDate.toISOString().split('T')[0],
            ownerId,
            slateType,
            wagerPp: parsedWager
        }
    }

    const handleSubmit = () => {
        const editArgs = getEditArgs()
        if (!editArgs) {
            showToast("Must fill in all fields")
            return
        }
        handleEdit(editArgs)
    }

    return (
        <View style={styles.card}>
            <View style={styles.dateWagerRow}>
                <View style={styles.dateColumn}>
                    <Text style={styles.label}>Competition Date</Text>
                    <View style={styles.datePickerContainer}>
                        <DateTimePicker
                            value={competitionDate ?? new Date()}
                            mode="date"
                            display="compact"
                            onChange={(_, selectedDate) => {
                                if (selectedDate) {
                                    setCompetitionDate(selectedDate)
                                }
                            }}
                            themeVariant="dark"
                        />
                    </View>
                </View>
                <View style={styles.wagerColumn}>
                    <Text style={styles.label}>Wager per person</Text>
                    <View style={styles.wagerInputRow}>
                        <Text style={styles.dollarSign}>$</Text>
                        <NumericInput
                            style={styles.wagerInput}
                            value={wagerPp}
                            onChangeText={setWagerPp}
                            placeholder="0.00"
                        />
                    </View>
                </View>
            </View>

            <Text style={styles.label}>Owner</Text>
            <SelectableTileGroup<Gambler>
                items={sortedGamblers}
                itemKey={g => g.id.toString()}
                handleSelect={g => setOwnerId(g.id)}
                selectedItem={sortedGamblers.find(g => g.id === ownerId) ?? null}
                itemDisplay={g => g.firstName}
                tileSize="sm"
                containerProps={{alignItems: "center"}}
                noScroll={true}
            />

            <Text style={styles.label}>Slate Type</Text>
            <SelectableTileGroup<SlateType>
                selectedItem={slateType}
                items={Object.values(SlateType)}
                itemKey={s => s}
                itemDisplay={s => s}
                handleSelect={setSlateType}
                noScroll={true}
                tileSize="sm"
                containerProps={{alignItems: "center"}}
            />

            <TouchableOpacity
                style={[styles.actionButton, isButtonDisabled && styles.actionButtonDisabled]}
                disabled={isButtonDisabled}
                onPress={handleSubmit}
                activeOpacity={0.7}
            >
                <Text style={[styles.actionButtonText, isButtonDisabled && styles.actionButtonTextDisabled]}>
                    {isEditing ? "Update" : "Create"}
                </Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    label: {
        ...typography.body,
        fontWeight: "600",
        color: colors.textSecondary,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    dateWagerRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: spacing.lg,
    },
    dateColumn: {
        flex: 1,
    },
    wagerColumn: {
        flex: 1,
    },
    datePickerContainer: {
        alignItems: "flex-start",
    },
    wagerInputRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    dollarSign: {
        ...typography.heading,
        color: colors.textSecondary,
        marginRight: spacing.xs,
    },
    wagerInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.inputBorder,
        borderRadius: 10,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        ...typography.heading,
        color: colors.textPrimary,
        backgroundColor: colors.inputBackground,
    },
    ownerContainer: {
        flexDirection: "row",
        marginBottom: spacing.lg,
    },
    ownerButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 16,
        backgroundColor: colors.card,
        marginRight: spacing.sm,
    },
    ownerButtonActive: {
        backgroundColor: colors.accent,
    },
    ownerText: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: "500",
    },
    ownerTextActive: {
        color: colors.textPrimary,
    },
    slateContainer: {
        marginBottom: spacing.lg,
    },
    slateRow: {
        flexDirection: "row",
        marginBottom: spacing.sm,
    },
    slateButton: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 16,
        backgroundColor: colors.card,
        marginRight: spacing.sm,
    },
    slateButtonActive: {
        backgroundColor: colors.accent,
    },
    slateText: {
        ...typography.caption,
        color: colors.textSecondary,
        fontWeight: "500",
    },
    slateTextActive: {
        color: colors.textPrimary,
    },
    actionButton: {
        backgroundColor: colors.accent,
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: "center",
        marginTop: spacing.lg,
        ...shadows.card,
    },
    actionButtonDisabled: {
        backgroundColor: colors.buttonDisabled,
    },
    actionButtonText: {
        color: colors.textPrimary,
        ...typography.heading,
    },
    actionButtonTextDisabled: {
        color: colors.textMuted,
    },
})
