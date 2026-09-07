/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SeasonPickResponseData } from './SeasonPickResponseData';
export type ListSeasonPicksResponseData = {
    season_picks: Array<SeasonPickResponseData>;
    season_long_picks_enabled: boolean;
    weeks: number;
    pick_count: number;
    latest_open_week: number;
    viewer_is_admin: boolean;
    editable: boolean;
};

