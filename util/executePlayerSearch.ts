import { PropBetTargetRequestData } from "@/api"
import Axios from "axios"

export type PlayerTeamResult = {
    identifier: string
    playerName: string | null
    teamName: string
}

function transformPlayerResults(result: any): PlayerTeamResult[] {
    if (Array.isArray(result) && result.length > 0) {
        return result.map(player => {
            return {
                identifier: player.uuid,
                playerName: player.displayName,
                teamName: player.teamRelationships[0].core.abbreviation
            }
        })
    }
    return []
}

function transformTeamResults(result: any): PlayerTeamResult[] {
    if (Array.isArray(result) && result.length > 0) {
        return result.map(player => {
            return {
                identifier: player.uuid,
                playerName: null,
                teamName: player.abbreviation
            }
        })
    }
    return []
}

const makeSearchUrl = (term: string, termType: "player" | "team") =>
    new URL(`https://site.web.api.espn.com/apis/common/v3/search?query=${term}&limit=20&mode=prefix&type=${termType}&sport=football&league=nfl&enable=position`).toString()

export function executePlayerTeamSearch(term: string) {
    return Promise.all([
        Axios.get(makeSearchUrl(term, "player")).then(data => transformPlayerResults(data.data.items)),
        Axios.get(makeSearchUrl(term, "team")).then(data => transformTeamResults(data.data.items))
    ]).then(([playerResults, teamResults]) => [...playerResults, ...teamResults])
}

export function playerTeamDisplay(t: PlayerTeamResult) {
    return t.playerName ? `${t.playerName} (${t.teamName})` : t.teamName
}

export function playerTeamResultToRequestData(ptr: PlayerTeamResult): PropBetTargetRequestData {
    return {
        identifier: ptr.identifier,
        team_name: ptr.teamName,
        player_name: ptr.playerName
    }
}