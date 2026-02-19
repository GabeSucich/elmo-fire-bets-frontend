/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ParlayResult } from './ParlayResult';
import type { ParlayState } from './ParlayState';
import type { PickResponseData } from './PickResponseData';
import type { SlateType } from './SlateType';
export type ParlayResponseData = {
    id: number;
    owner_id: number;
    slate_type: SlateType;
    wager_pp: number;
    competition_date: string;
    picks: Array<PickResponseData>;
    state: ParlayState;
    result: (ParlayResult | null);
    order: number;
};

