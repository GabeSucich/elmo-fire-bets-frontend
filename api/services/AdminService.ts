/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SyncPlayersResponseData } from '../models/SyncPlayersResponseData';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AdminService {
    /**
     * Sync Players Endpoint
     * Resolve missing ESPN ids across every player target, then correct their teams.
     *
     * Slow in proportion to how many players the league has ever bet on, and worth running
     * after an offseason rather than on a timer: a badge that is a club out of date is the
     * symptom, and it only appears when somebody moves.
     * @returns SyncPlayersResponseData Successful Response
     * @throws ApiError
     */
    public static syncPlayers(): CancelablePromise<SyncPlayersResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/admin/sync_players',
        });
    }
}
