/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PropBetDirection } from './PropBetDirection';
import type { PropBetTargetRequestData } from './PropBetTargetRequestData';
import type { PropBetType } from './PropBetType';
import type { SauceFactor } from './SauceFactor';
export type PickOverrideRequestData = {
    pick_id: number;
    prop_bet_target: (PropBetTargetRequestData | null);
    direction: (PropBetDirection | null);
    sauce_factor: (SauceFactor | null);
    corrected_line: (number | null);
    prop_type: (PropBetType | null);
};

