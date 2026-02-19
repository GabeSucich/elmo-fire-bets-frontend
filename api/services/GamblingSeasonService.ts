/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GetGamblingSeasonResponseData } from '../models/GetGamblingSeasonResponseData';
import type { GetSeasonGamblerPerformancesResponseData } from '../models/GetSeasonGamblerPerformancesResponseData';
import type { GetSeasonParlaysResponseData } from '../models/GetSeasonParlaysResponseData';
import type { GetSeasonParlaysSortParam } from '../models/GetSeasonParlaysSortParam';
import type { GetSeasonTimeSeriesResponseData } from '../models/GetSeasonTimeSeriesResponseData';
import type { GetUserGamblingSeasonsResponseData } from '../models/GetUserGamblingSeasonsResponseData';
import type { ParlayState } from '../models/ParlayState';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class GamblingSeasonService {
    /**
     * Get User Gambling Seasions
     * @returns GetUserGamblingSeasonsResponseData Successful Response
     * @throws ApiError
     */
    public static getUserGamblingSeasons(): CancelablePromise<GetUserGamblingSeasonsResponseData> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/gambling_seasons/',
        });
    }
    /**
     * Get Gambling Season
     * @param seasonId
     * @returns GetGamblingSeasonResponseData Successful Response
     * @throws ApiError
     */
    public static getGamblingSeason(
        seasonId: number,
    ): CancelablePromise<GetGamblingSeasonResponseData> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/gambling_seasons/{season_id}',
            path: {
                'season_id': seasonId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Season Parlays
     * @param seasonId
     * @param limit The number of results to return
     * @param offset Offset to start descending query
     * @param state State of parlays to retrieve
     * @param sort How to sort parlays in query
     * @returns GetSeasonParlaysResponseData Successful Response
     * @throws ApiError
     */
    public static getSeasonParlays(
        seasonId: number,
        limit: number = 20,
        offset?: number,
        state?: (ParlayState | null),
        sort: GetSeasonParlaysSortParam = 'asc',
    ): CancelablePromise<GetSeasonParlaysResponseData> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/gambling_seasons/{season_id}/parlays',
            path: {
                'season_id': seasonId,
            },
            query: {
                'limit': limit,
                'offset': offset,
                'state': state,
                'sort': sort,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Season Gambler Performances
     * @param seasonId
     * @returns GetSeasonGamblerPerformancesResponseData Successful Response
     * @throws ApiError
     */
    public static getSeasonGamblerPerformances(
        seasonId: number,
    ): CancelablePromise<GetSeasonGamblerPerformancesResponseData> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/gambling_seasons/{season_id}/gambler_performances',
            path: {
                'season_id': seasonId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Season Time Series
     * @param seasonId
     * @returns GetSeasonTimeSeriesResponseData Successful Response
     * @throws ApiError
     */
    public static getSeasonTimeSeries(
        seasonId: number,
    ): CancelablePromise<GetSeasonTimeSeriesResponseData> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/gambling_seasons{season_id}/time_series',
            path: {
                'season_id': seasonId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
