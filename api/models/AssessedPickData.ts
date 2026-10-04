/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PropBetDirection } from './PropBetDirection';
import type { PropBetType } from './PropBetType';
import type { SauceFactor } from './SauceFactor';
/**
 * A pick as it stood when it was assessed, for comparing against how it stands now.
 */
export type AssessedPickData = {
    pick_id: number;
    player: (string | null);
    prop_type: PropBetType;
    line: number;
    direction: PropBetDirection;
    sauce_factor: (SauceFactor | null);
    vetoed: boolean;
};

