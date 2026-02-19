import { BasicPickResult, ParlayResult, PickResult, VetoResult } from "@/api";

const BASIC_PICK_RESULT: Record<BasicPickResult, {color: string, sortOrder: number}> = {
    [BasicPickResult.WIN]: {color: 'green', sortOrder: 1},
    [BasicPickResult.LOSS]: {color: 'red', sortOrder: 2},
    [BasicPickResult.VOID]: { color: 'orange', sortOrder: 3},
    [BasicPickResult.PUSH]: { color: 'gray', sortOrder: 4}
}

export const PickResultColors: Record<PickResult | 'None', string> = {
    None: '#3b82f6',
    [PickResult.WIN]: '#4ade80',
    [PickResult.LOSS]: '#f87171',
    [PickResult.BOZO]: '#b91c1c',
    [PickResult.PUSH]: '#9ca3af',
    [PickResult.VOID]: '#fb923c',
}

export const ParlayResultColors: Record<ParlayResult, string> = {
    [ParlayResult.WIN]: '#4ade80',
    [ParlayResult.LOSS]: '#f87171',
    [ParlayResult.BOZO]: '#b91c1c',
    [ParlayResult.PUSH]: '#9ca3af',
    [ParlayResult.VOID]: '#fb923c',
}

export const VetoResultColors: Record<VetoResult, string> = {
    [VetoResult.GOOD]: '#4ade80',
    [VetoResult.BAD]: '#f87171',
    [VetoResult.BOZO]: '#b91c1c',
    [VetoResult.PUSH]: '#9ca3af',
    [VetoResult.VOID]: '#fb923c',
    [VetoResult.BOZO_SAVER]: '#16a34a',
}

export function sortedBasicPickResults() {
    return Object.values(BasicPickResult).sort((a, b) => BASIC_PICK_RESULT[a].sortOrder - BASIC_PICK_RESULT[b].sortOrder)
}

export function getBasicPickResultColor(result: BasicPickResult) {
    return BASIC_PICK_RESULT[result].color
}