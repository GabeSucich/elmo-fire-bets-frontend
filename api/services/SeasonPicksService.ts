/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FinalizeRequestData } from '../models/FinalizeRequestData';
import type { ListSeasonPicksResponseData } from '../models/ListSeasonPicksResponseData';
import type { SeasonPickRequestData } from '../models/SeasonPickRequestData';
import type { SeasonPickResponse } from '../models/SeasonPickResponse';
import type { SyncSeasonPicksResponseData } from '../models/SyncSeasonPicksResponseData';
import type { WeekProgressRequestData } from '../models/WeekProgressRequestData';
import type { WeeksProgressRequestData } from '../models/WeeksProgressRequestData';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SeasonPicksService {
    /**
     * List Season Picks
     * @param seasonId
     * @returns ListSeasonPicksResponseData Successful Response
     * @throws ApiError
     */
    public static listSeasonPicks(
        seasonId: number,
    ): CancelablePromise<ListSeasonPicksResponseData> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/season_picks/season/{season_id}',
            path: {
                'season_id': seasonId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Season Pick
     * @param seasonId
     * @param requestBody
     * @returns SeasonPickResponse Successful Response
     * @throws ApiError
     */
    public static createSeasonPick(
        seasonId: number,
        requestBody: SeasonPickRequestData,
    ): CancelablePromise<SeasonPickResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/season_picks/season/{season_id}',
            path: {
                'season_id': seasonId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Season Pick
     * @param pickId
     * @param requestBody
     * @returns SeasonPickResponse Successful Response
     * @throws ApiError
     */
    public static updateSeasonPick(
        pickId: number,
        requestBody: SeasonPickRequestData,
    ): CancelablePromise<SeasonPickResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/season_picks/{pick_id}',
            path: {
                'pick_id': pickId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Season Pick
     * @param pickId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteSeasonPick(
        pickId: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/season_picks/{pick_id}',
            path: {
                'pick_id': pickId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Finalize Season Pick
     * @param pickId
     * @param requestBody
     * @returns SeasonPickResponse Successful Response
     * @throws ApiError
     */
    public static finalizeSeasonPick(
        pickId: number,
        requestBody: FinalizeRequestData,
    ): CancelablePromise<SeasonPickResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/season_picks/{pick_id}/finalize',
            path: {
                'pick_id': pickId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Season Pick Week
     * @param pickId
     * @param week
     * @param requestBody
     * @returns SeasonPickResponse Successful Response
     * @throws ApiError
     */
    public static updateSeasonPickWeek(
        pickId: number,
        week: number,
        requestBody: WeekProgressRequestData,
    ): CancelablePromise<SeasonPickResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/season_picks/{pick_id}/weeks/{week}',
            path: {
                'pick_id': pickId,
                'week': week,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Season Pick Weeks
     * @param pickId
     * @param requestBody
     * @returns SeasonPickResponse Successful Response
     * @throws ApiError
     */
    public static updateSeasonPickWeeks(
        pickId: number,
        requestBody: WeeksProgressRequestData,
    ): CancelablePromise<SeasonPickResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/season_picks/{pick_id}/weeks',
            path: {
                'pick_id': pickId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Sync Season Picks Endpoint
     * Pull every season pick in this season up to date with ESPN.
     *
     * Open to anyone in the season. It rewrites results across everyone's picks at once,
     * including weeks entered by hand, but ESPN is the source of truth for all of them — so
     * there is nothing here one gambler can do to another's pick that the next press would
     * not do anyway. Slow by nature, one ESPN call per distinct player or team, so it stays
     * a deliberate action rather than something a screen triggers on load.
     *
     * The only way the sweep runs: nothing else calls it. Weeks stay as they were until
     * somebody presses this, so a spell of ESPN being unreachable is recovered by pressing
     * it again rather than by waiting.
     * @param seasonId
     * @returns SyncSeasonPicksResponseData Successful Response
     * @throws ApiError
     */
    public static syncSeasonPicks(
        seasonId: number,
    ): CancelablePromise<SyncSeasonPicksResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/season_picks/season/{season_id}/sync',
            path: {
                'season_id': seasonId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
