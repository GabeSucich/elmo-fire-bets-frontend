/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ParlayResponseData } from './ParlayResponseData';
/**
 * The refreshed parlay, plus what the sweep could and could not answer.
 *
 * The whole parlay comes back rather than just the numbers: every leg's state and detail
 * may have moved, and re-reading them from one response is simpler than patching each.
 */
export type SyncParlayProgressResponseData = {
    parlay: ParlayResponseData;
    picks_synced: number;
    skipped: Array<string>;
    ran: boolean;
};

