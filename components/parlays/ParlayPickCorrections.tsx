import { ParlayResponseData, PickResponseData } from "@/api"
import { Gambler, useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import TabButtons from "../reusable/TabButtons"
import { useState } from "react"
import { Text, View } from "react-native"
import OwnerPickEditor from "../picks/OwnerPickEditor"
import ActionButton from "../reusable/ActionButton"
import { useParlaysContext } from "@/contexts/parlaysContext"

type Props = {
    parlay: ParlayResponseData
    onDone: () => void
}

export default function ParlayPickCorrections(props: Props) {
    const {
        sortedGamblers
    } = useGamblingSeasonContext()

    const [correctedPicks, setCorrectedPicks] = useState<PickResponseData[]>([])

    function findGamblerPick(gamblerId: number) {
        const correctedPick = correctedPicks.find(p => p.gambler_id === gamblerId)
        if (correctedPick) return correctedPick

        return props.parlay.picks?.find(p => p.gambler_id === gamblerId) ?? null
    }

    function gamblerHasCorrection(gambler: Gambler) {
        const pick = findGamblerPick(gambler.id)
        return !!pick?.corrected_line
    }

    function getNextGamblerToFocus(startIndex?: number) {
        startIndex = startIndex ?? 0
        let nextGambler: Gambler | undefined = sortedGamblers.slice(startIndex).find(g => !gamblerHasCorrection(g))
        if (!nextGambler) {
            nextGambler = sortedGamblers.find(g => !gamblerHasCorrection(g))
        }
        return nextGambler ?? sortedGamblers[0]
    }

    const [focusedGambler, setFocusedGambler] = useState(getNextGamblerToFocus() ?? sortedGamblers[0])

    function handlePickOverrideSaved(pick: PickResponseData) {
        setCorrectedPicks([
            ...correctedPicks.filter(p => p.id !== pick.id),
            pick
        ])

        const gamblerIndex = Math.max(sortedGamblers.map(g => g.id).indexOf(pick.gambler_id))
        const nextGambler = getNextGamblerToFocus(gamblerIndex + 1)
        setFocusedGambler(nextGambler)
    }

    function needsCorrectionText() {
        const gamblersNeedingCorrectionCnt = sortedGamblers.filter(g => !gamblerHasCorrection(g)).length
        if (gamblersNeedingCorrectionCnt === 0) return null
        if (gamblersNeedingCorrectionCnt === 1) return `1 correction needed`
        return `${gamblersNeedingCorrectionCnt} corrections needed`
    }

    function getGamblerTabDisplay(gambler: Gambler) {
        if (gamblerHasCorrection(gambler)) return gambler.firstName
        return `${gambler.firstName} (!)`
    }

    const correctionText = needsCorrectionText()

    return (
        <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <ActionButton text="Close" onPress={props.onDone} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {correctionText && (
                        <>
                            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: 'red' }} />
                            <Text style={{ fontSize: 12, color: 'red', fontWeight: '500' }}>{correctionText}</Text>
                        </>
                    )}
                </View>
            </View>
            <TabButtons<Gambler>
                tabs={sortedGamblers}
                activeTab={focusedGambler}
                setActiveTab={g => setFocusedGambler(g)}
                getDisplay={g => getGamblerTabDisplay(g)}
                getKey={g => `parlay-correction-${g.id}`}
                size="sm"
                colorProps={g => gamblerHasCorrection(g)
                    ? {}
                    : { textColor: 'red', activeBackgroundColor: 'red', activeTextColor: 'white' }
                }
            />
            <OwnerPickEditor
                key={focusedGambler.id}
                gamblerId={focusedGambler.id}
                parlay={props.parlay}
                pick={findGamblerPick(focusedGambler.id)}
                onPickCorrected={p => handlePickOverrideSaved(p)}
            />
        </View>
    )
}