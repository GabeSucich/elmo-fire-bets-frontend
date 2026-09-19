/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PropBetDirection } from './PropBetDirection';
import type { PropBetTargetResponseData } from './PropBetTargetResponseData';
import type { PropBetType } from './PropBetType';
export type PickListItemResponseData = {
    id: number;
    pick_list_id: number;
    gambler_id: number;
    prop_bet_target_id: number;
    prop_bet_target: PropBetTargetResponseData;
    prop_type: (PropBetType | null);
    direction: (PropBetDirection | null);
};

