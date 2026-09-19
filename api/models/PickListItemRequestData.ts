/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PropBetDirection } from './PropBetDirection';
import type { PropBetTargetRequestData } from './PropBetTargetRequestData';
import type { PropBetType } from './PropBetType';
export type PickListItemRequestData = {
    gambler_id: number;
    target: PropBetTargetRequestData;
    prop_type?: (PropBetType | null);
    direction?: (PropBetDirection | null);
};

