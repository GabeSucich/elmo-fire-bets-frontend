/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PropBetDirection } from './PropBetDirection';
import type { PropBetTargetRequestData } from './PropBetTargetRequestData';
import type { PropBetType } from './PropBetType';
import type { SauceFactor } from './SauceFactor';
export type CreatePickRequestData = {
    gambler_id: number;
    parlay_id: number;
    target: PropBetTargetRequestData;
    direction: PropBetDirection;
    line: number;
    sauce_factor: (SauceFactor | null);
    prop_type: PropBetType;
    corrected_line?: (number | null);
};

