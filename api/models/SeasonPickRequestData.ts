/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PropBetDirection } from './PropBetDirection';
import type { PropBetTargetRequestData } from './PropBetTargetRequestData';
import type { PropBetType } from './PropBetType';
import type { SeasonPickKind } from './SeasonPickKind';
export type SeasonPickRequestData = {
    gambler_id: number;
    kind: SeasonPickKind;
    target: PropBetTargetRequestData;
    prop_type?: (PropBetType | null);
    line: number;
    direction: PropBetDirection;
};

