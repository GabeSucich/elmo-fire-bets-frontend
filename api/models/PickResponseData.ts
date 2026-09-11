/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PickReactionResponseData } from './PickReactionResponseData';
import type { PickResult } from './PickResult';
import type { PickVetoResponseData } from './PickVetoResponseData';
import type { PropBetDirection } from './PropBetDirection';
import type { PropBetTargetResponseData } from './PropBetTargetResponseData';
import type { PropBetType } from './PropBetType';
import type { SauceFactor } from './SauceFactor';
export type PickResponseData = {
    id: number;
    gambler_id: number;
    line: number;
    corrected_line: (number | null);
    direction: PropBetDirection;
    sauce_factor: (SauceFactor | null);
    result: (PickResult | null);
    veto: (PickVetoResponseData | null);
    prop_bet_target: PropBetTargetResponseData;
    prop_type: PropBetType;
    reactions: Array<PickReactionResponseData>;
    comment_count: number;
    live_value: (number | null);
    live_state: (string | null);
    live_detail: (string | null);
    live_synced_at: (string | null);
};

