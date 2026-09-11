import { PropBetTargetRequestData } from "@/api"
import axios from "axios"
import { fallbackSearchTerms } from "@/util/nameMatch"

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
        axios.get(makeSearchUrl(term, "player")).then(data => transformPlayerResults(data.data.items)),
        axios.get(makeSearchUrl(term, "team")).then(data => transformTeamResults(data.data.items))
    ]).then(([playerResults, teamResults]) => [...playerResults, ...teamResults])
}

/**
 * The same search, widened when a name finds nobody.
 *
 * A sportsbook's spelling is not always ESPN's, and when it differs badly enough the
 * search comes back empty and the pick becomes a dead end — "that name did not match
 * anyone, enter it by hand". Trying the surname, then the forename, turns that into a
 * short list to choose from.
 *
 * Only ever widens what is offered. The caller decides what a match is, and nothing that
 * comes back from a narrower term should be taken as one on its own — a search for "Sims"
 * answers with every Sims in the league.
 */
export async function searchPlayersWithFallback(term: string): Promise<PlayerTeamResult[]> {
    const direct = await executePlayerTeamSearch(term)
    if (direct.length > 0) return direct

    const seen = new Set<string>()
    const widened: PlayerTeamResult[] = []
    for (const fallback of fallbackSearchTerms(term)) {
        const found = await axios
            .get(makeSearchUrl(fallback, "player"))
            .then(data => transformPlayerResults(data.data.items))
            .catch(() => [] as PlayerTeamResult[])
        for (const candidate of found) {
            if (seen.has(candidate.identifier)) continue
            seen.add(candidate.identifier)
            widened.push(candidate)
        }
    }
    return widened
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