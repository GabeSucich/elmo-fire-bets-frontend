import { SlateType } from "@/api"

export type ParlayEditArgs = {
    competitionDate: string
    ownerId: number
    slateType: SlateType
    wagerPp: number
}