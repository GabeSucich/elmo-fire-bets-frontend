/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PropBetDirection } from './PropBetDirection';
import type { PropBetType } from './PropBetType';
/**
 * A single bet leg read off an uploaded parlay screenshot.
 *
 * `raw_text` is carried through to the review UI so a reviewer can see what the
 * model actually read, which is the only practical check on alternate-line
 * normalization (`2+` becoming Over 1.5).
 */
export type ExtractedLeg = {
    leg_index: number;
    raw_text: string;
    player_name: (string | null);
    team_name: (string | null);
    prop_type: (PropBetType | null);
    direction: PropBetDirection;
    number: number;
};

