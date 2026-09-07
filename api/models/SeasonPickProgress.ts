/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SeasonPickStatus } from './SeasonPickStatus';
import type { SeasonPickWeekProgress } from './SeasonPickWeekProgress';
export type SeasonPickProgress = {
    total: number;
    weeks_recorded: number;
    weeks_played: number;
    missing_weeks: Array<number>;
    next_week_to_enter: (number | null);
    status: SeasonPickStatus;
    weeks: Array<SeasonPickWeekProgress>;
};

