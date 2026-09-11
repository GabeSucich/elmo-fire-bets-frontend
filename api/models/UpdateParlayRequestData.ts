/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SlateType } from './SlateType';
export type UpdateParlayRequestData = {
    parlay_id: number;
    competition_date: (string | null);
    slate_type: (SlateType | null);
    owner_id: (number | null);
    wager_pp: (number | null);
    payout_pp?: (number | null);
    clear_payout?: boolean;
};

