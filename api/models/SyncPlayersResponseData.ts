/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Enough to tell a sweep that worked from one that quietly matched nothing.
 *
 * `ids_failed` names the players ESPN could not find, which is the list worth acting on:
 * a target with no athlete id is invisible to every later refresh until its name is
 * fixed.
 */
export type SyncPlayersResponseData = {
    targets_seen: number;
    ids_resolved: number;
    ids_failed: Array<string>;
    team_changes: Array<string>;
};

