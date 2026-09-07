/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PropBetDirection } from './PropBetDirection';
import type { PropBetTargetResponseData } from './PropBetTargetResponseData';
import type { PropBetType } from './PropBetType';
import type { SeasonPickKind } from './SeasonPickKind';
import type { SeasonPickProgress } from './SeasonPickProgress';
export type SeasonPickResponseData = {
    id: number;
    gambler_id: number;
    is_finalized: boolean;
    gambling_season_id: number;
    kind: SeasonPickKind;
    prop_bet_target_id: number;
    target_name: string;
    prop_bet_target: PropBetTargetResponseData;
    prop_type: (PropBetType | null);
    line: number;
    direction: PropBetDirection;
    progress: SeasonPickProgress;
};

