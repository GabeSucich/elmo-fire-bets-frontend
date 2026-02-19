/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GamblerResponseData } from './GamblerResponseData';
import type { GamblingSeasonState } from './GamblingSeasonState';
export type GetGamblingSeasonResponseData = {
    id: number;
    gambler_id: number;
    name: string;
    year: number;
    state: GamblingSeasonState;
    gamblers: Record<string, GamblerResponseData>;
};

