import { GamblingSeasonState, GetGamblingSeasonResponseData, ListGamblingSeasonEl } from "@/api"
import { createContext, ReactNode, useContext } from "react"

export interface Gambler {
    userId: number
    id: number
    firstName: string
    lastName: string
}

export interface GamblingSeasonContextType {
    id: number
    gamblerId: number
    year: number
    name: string
    state: GamblingSeasonState
    gamblers: Record<number, Gambler>
    sortedGamblers: Gambler[]
}

const GamblingSeasonContext = createContext<GamblingSeasonContextType | null>(null)

type GamblingSeasonProviderProps = {
    children: ReactNode,
    gamblingSeason: GetGamblingSeasonResponseData
}

export function GamblingSeasonProvider(props: GamblingSeasonProviderProps) {
    const gamblers = Object.values(props.gamblingSeason.gamblers).reduce<Record<number, Gambler>>((acc, gambler) => {
        return {
            ...acc,
            [gambler.id]: {userId: gambler.user_id, id: gambler.id, firstName: gambler.first_name, lastName: gambler.last_name}
        }
    }, {})
    const sortedGamblers = Object.values(gamblers).sort((a, b) => a.firstName.localeCompare(b.firstName))
    return (
        <GamblingSeasonContext.Provider value={{
            id: props.gamblingSeason.id,
            gamblerId: props.gamblingSeason.gambler_id,
            year: props.gamblingSeason.year,
            state: props.gamblingSeason.state,
            name: props.gamblingSeason.name,
            gamblers,
            sortedGamblers
        }}>{ props.children }</GamblingSeasonContext.Provider>
    )
}

export function useGamblingSeasonContext() {
    const context = useContext(GamblingSeasonContext)
    if (!context) {
        throw new Error("Must call useGamblingSeasonContext from within a provider!")
    }
    return context
}

