import { ParlayResponseData, PickResponseData, PicksService } from "@/api"
import { Gambler, useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import { Text, View } from "react-native"
import PickEditor from "./PickEditor"
import { PickCreateEditData } from "./common"
import { useState } from "react"
import { playerTeamResultToRequestData } from "@/util/executePlayerSearch"
import { setApiErrorMsg } from "@/util/error"
import ErrorView from "../reusable/ErrorView"
import ActivityLoader from "../reusable/ActivityLoader"

type Props = {
    pick: PickResponseData | null
    parlay: ParlayResponseData
    gamblerId: number
    onPickCorrected: (pick: PickResponseData) => void
}

export default function OwnerPickEditor(props: Props) {
    const {
        gamblers
    } = useGamblingSeasonContext()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const gambler = gamblers[props.gamblerId]

    function createPick(pick: PickCreateEditData) {
        setLoading(true)
        setError(null)
        PicksService.createPick({
            prop_type: pick.propType,
            target: playerTeamResultToRequestData(pick.playerTeamResult),
            line: pick.line,
            direction: pick.direction,
            parlay_id: props.parlay.id,
            corrected_line: pick.line,
            gambler_id: props.gamblerId,
            sauce_factor: pick.sauceFactor
        })
        .then(res => props.onPickCorrected(res.pick))
        .catch(e => setApiErrorMsg(e, setError, "There was an error creating the pick"))
        .finally(() => setLoading(false))
    }

    function overridePick(existingPick: PickResponseData, updateData: PickCreateEditData) {
        setLoading(true)
        setError(null)
        PicksService.applyPickOverride(existingPick.id, {
            prop_type: updateData.propType,
            target: playerTeamResultToRequestData(updateData.playerTeamResult),
            line: updateData.line,
            direction: updateData.direction,
            sauce_factor: updateData.sauceFactor,
        })
        .then(res => props.onPickCorrected(res.pick))
        .catch(e => setApiErrorMsg(e, setError, "There wasn an error updating the pick"))
        .finally(() => setLoading(false))
    }

    function handleEdit(updateData: PickCreateEditData) {
        if (props.pick) {
            overridePick(props.pick, updateData)
        } else {
            createPick(updateData)
        }
    }

    const gamblerFirstName = gamblers[props.gamblerId].firstName
    const title = props.pick ? `Correcting pick for ${gamblerFirstName}` : `Adding pick for ${gamblerFirstName}`
    
    if (loading) {
        return <ActivityLoader 
            indicatorProps={{size: "small"}}
            text={`Saving correction for ${gambler.firstName}...`}
        />
    }

    return (
        <View>
            <Text style={{fontWeight: 'bold', fontStyle: 'italic', textAlign: 'center'}}>{ title }</Text>
            <PickEditor 
                pick={props.pick}
                handleEdit={handleEdit}
                showDeleteVetoOption={true}
                allowInPlaceCorrection={!props.pick?.corrected_line}
            />
            <ErrorView errorMsg={error}/>
        </View>
    )
}