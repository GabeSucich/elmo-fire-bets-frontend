import { CreateParlayRequestData, ParlayResponseData, SlateType } from "@/api"
import { Gambler, useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import React, { useState, useMemo } from "react"
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import SelectableTileGroup from "../reusable/tiles/SelectableTileGroup"
import { ParlayEditArgs } from "./common"

type Props = {
    parlay?: ParlayResponseData
    handleEdit: (args: ParlayEditArgs) => void
}

export default function ParlayEditCard({ parlay, handleEdit }: Props) {
    const { sortedGamblers, gamblerId } = useGamblingSeasonContext()

    const [competitionDate, setCompetitionDate] = useState<Date | null>(
        parlay?.competition_date ? new Date(parlay.competition_date) : null
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

    const [error, setError] = useState<string | null>(null)

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
            setError("Must fill in all fields")
            setTimeout(() => setError(null), 5000)
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
                        />
                    </View>
                </View>
                <View style={styles.wagerColumn}>
                    <Text style={styles.label}>Wager per person</Text>
                    <View style={styles.wagerInputRow}>
                        <Text style={styles.dollarSign}>$</Text>
                        <TextInput
                            style={styles.wagerInput}
                            value={wagerPp}
                            onChangeText={setWagerPp}
                            keyboardType="numeric"
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
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginBottom: 8,
        marginTop: 12,
    },
    dateWagerRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 16,
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
        fontSize: 16,
        color: "#333",
        marginRight: 4,
    },
    wagerInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#e0e0e0",
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        fontSize: 16,
        color: "#333",
    },
    ownerContainer: {
        flexDirection: "row",
        marginBottom: 16,
    },
    ownerButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: "#e0e0e0",
        marginRight: 8,
    },
    ownerButtonActive: {
        backgroundColor: "#007AFF",
    },
    ownerText: {
        fontSize: 12,
        color: "#666",
        fontWeight: "500",
    },
    ownerTextActive: {
        color: "#fff",
    },
    slateContainer: {
        marginBottom: 16,
    },
    slateRow: {
        flexDirection: "row",
        marginBottom: 8,
    },
    slateButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: "#e0e0e0",
        marginRight: 8,
    },
    slateButtonActive: {
        backgroundColor: "#007AFF",
    },
    slateText: {
        fontSize: 12,
        color: "#666",
        fontWeight: "500",
    },
    slateTextActive: {
        color: "#fff",
    },
    actionButton: {
        backgroundColor: "#007AFF",
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 16,
    },
    actionButtonDisabled: {
        backgroundColor: "#e0e0e0",
    },
    actionButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    actionButtonTextDisabled: {
        color: "#999",
    },
})
