/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * What the sweep did, rather than a bare success.
 *
 * A sync that quietly matched nothing looks identical to one that worked unless it says
 * how much it touched — and `skipped` names the picks ESPN could not answer for, which
 * is the list worth acting on.
 */
export type SyncSeasonPicksResponseData = {
    picks_seen: number;
    picks_synced: number;
    weeks_written: number;
    weeks_updated: number;
    skipped: Array<string>;
};

