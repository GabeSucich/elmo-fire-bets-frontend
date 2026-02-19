import { PropBetDirection, PropBetType, SauceFactor } from "@/api"
import { PlayerTeamResult } from "@/util/executePlayerSearch"

export type PickCreateEditData = {
    playerTeamResult: PlayerTeamResult,
    propType: PropBetType,
    line: number,
    direction: PropBetDirection,
    sauceFactor: SauceFactor
    deleteVeto?: boolean
}