import { ParlayResponseData, PickResponseData, PicksService } from "@/api"
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import { Text, View } from "react-native"
import PickEditor from "./PickEditor"
import { PickCreateEditData } from "./common"
import { playerTeamResultToRequestData } from "@/util/executePlayerSearch"
import OverlayLoader from "../reusable/OverlayLoader"
import { useLoadingState } from "@/composables/useLoadingState"
import useApiActionState from "@/composables/useApiActionState"
import { colors, typography, spacing } from "@/theme/colors"

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

    const {
        loading, setLoading
    } = useLoadingState()

    const gambler = gamblers[props.gamblerId]

    const {
        execute: createPick
    } = useApiActionState(
        (pick: PickCreateEditData) => PicksService.createPick({
            prop_type: pick.propType,
            target: playerTeamResultToRequestData(pick.playerTeamResult),
            line: pick.line,
            direction: pick.direction,
            parlay_id: props.parlay.id,
            corrected_line: pick.line,
            gambler_id: props.gamblerId,
            sauce_factor: pick.sauceFactor
        }),
        res => props.onPickCorrected(res.pick),
        setLoading,
        "There was an error creating the pick"
    )

    const {
        execute: overridePick
    } = useApiActionState(
        (args: { existingPick: PickResponseData, updateData: PickCreateEditData }) => PicksService.applyPickOverride(args.existingPick.id, {
            prop_type: args.updateData.propType,
            target: playerTeamResultToRequestData(args.updateData.playerTeamResult),
            line: args.updateData.line,
            direction: args.updateData.direction,
            sauce_factor: args.updateData.sauceFactor,
        }),
        res => props.onPickCorrected(res.pick),
        setLoading,
        "There was an error updating the pick"
    )

    function handleEdit(updateData: PickCreateEditData) {
        if (props.pick) {
            overridePick({ existingPick: props.pick, updateData })
        } else {
            createPick(updateData)
        }
    }

    const gamblerFirstName = gamblers[props.gamblerId].firstName
    const title = props.pick ? `Correcting pick for ${gamblerFirstName}` : `Adding pick for ${gamblerFirstName}`

    return (
        <View>
            {loading && <OverlayLoader loaderProps={{text: `Saving correction for ${gambler.firstName}...`, size: 20}} />}
            <Text style={{
                ...typography.heading,
                fontStyle: 'italic',
                textAlign: 'center',
                color: colors.textPrimary,
                marginVertical: spacing.sm,
            }}>{ title }</Text>
            <PickEditor
                pick={props.pick}
                handleEdit={handleEdit}
                showDeleteVetoOption={true}
                allowInPlaceCorrection={!props.pick?.corrected_line}
            />
        </View>
    )
}
