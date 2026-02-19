/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PropBetDirection } from './PropBetDirection';
import type { PropBetTargetRequestData } from './PropBetTargetRequestData';
import type { PropBetType } from './PropBetType';
import type { SauceFactor } from './SauceFactor';
export type UpdatePickRequestData = {
    target?: (PropBetTargetRequestData | null);
    prop_type?: (PropBetType | null);
    direction?: (PropBetDirection | null);
    line?: (number | null);
    sauce_factor?: (SauceFactor | null);
};

