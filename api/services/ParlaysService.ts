/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClaimParlayRequestData } from '../models/ClaimParlayRequestData';
import type { ClaimParlayResponseData } from '../models/ClaimParlayResponseData';
import type { CloseParlayRequestData } from '../models/CloseParlayRequestData';
import type { CloseParlayResponseData } from '../models/CloseParlayResponseData';
import type { CreateParlayRequestData } from '../models/CreateParlayRequestData';
import type { CreateParlayResponseData } from '../models/CreateParlayResponseData';
import type { DeleteParlayResponseData } from '../models/DeleteParlayResponseData';
import type { FinalizeParlayResultsRequestData } from '../models/FinalizeParlayResultsRequestData';
import type { FinalizeParlayResultsResponseData } from '../models/FinalizeParlayResultsResponseData';
import type { GetParlayResponseData } from '../models/GetParlayResponseData';
import type { LockParlayRequestData } from '../models/LockParlayRequestData';
import type { LockParlayResponseData } from '../models/LockParlayResponseData';
import type { ReopenParlayRequestData } from '../models/ReopenParlayRequestData';
import type { ReopenParlayResponseData } from '../models/ReopenParlayResponseData';
import type { SwapParlayOrderRequestData } from '../models/SwapParlayOrderRequestData';
import type { SwapParlayOrderResponseData } from '../models/SwapParlayOrderResponseData';
import type { UnlockParlayRequestData } from '../models/UnlockParlayRequestData';
import type { UnlockParlayResponseData } from '../models/UnlockParlayResponseData';
import type { UpdateParlayRequestData } from '../models/UpdateParlayRequestData';
import type { UpdateParlayResponseData } from '../models/UpdateParlayResponseData';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ParlaysService {
    /**
     * Get Parlay
     * @param parlayId
     * @returns GetParlayResponseData Successful Response
     * @throws ApiError
     */
    public static getParlay(
        parlayId: number,
    ): CancelablePromise<GetParlayResponseData> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/parlays/{parlay_id}',
            path: {
                'parlay_id': parlayId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Parlay
     * @param parlayId
     * @returns DeleteParlayResponseData Successful Response
     * @throws ApiError
     */
    public static deleteParlay(
        parlayId: number,
    ): CancelablePromise<DeleteParlayResponseData> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/parlays/{parlay_id}',
            path: {
                'parlay_id': parlayId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Parlay
     * @param requestBody
     * @returns CreateParlayResponseData Successful Response
     * @throws ApiError
     */
    public static createParlay(
        requestBody: CreateParlayRequestData,
    ): CancelablePromise<CreateParlayResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/parlays/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Parlay
     * @param requestBody
     * @returns UpdateParlayResponseData Successful Response
     * @throws ApiError
     */
    public static updateParlay(
        requestBody: UpdateParlayRequestData,
    ): CancelablePromise<UpdateParlayResponseData> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/parlays/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Claim Parlay
     * @param parlayId
     * @param requestBody
     * @returns ClaimParlayResponseData Successful Response
     * @throws ApiError
     */
    public static claimParlay(
        parlayId: number,
        requestBody: ClaimParlayRequestData,
    ): CancelablePromise<ClaimParlayResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/parlays/{parlay_id}/claim',
            path: {
                'parlay_id': parlayId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Unlock Parlay
     * @param parlayId
     * @param requestBody
     * @returns UnlockParlayResponseData Successful Response
     * @throws ApiError
     */
    public static unlockParlay(
        parlayId: number,
        requestBody: UnlockParlayRequestData,
    ): CancelablePromise<UnlockParlayResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/parlays/{parlay_id}/unlock',
            path: {
                'parlay_id': parlayId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Lock Parlay
     * @param parlayId
     * @param requestBody
     * @returns LockParlayResponseData Successful Response
     * @throws ApiError
     */
    public static lockParlay(
        parlayId: number,
        requestBody: LockParlayRequestData,
    ): CancelablePromise<LockParlayResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/parlays/{parlay_id}/lock',
            path: {
                'parlay_id': parlayId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Finalize Parlay Results
     * @param parlayId
     * @param requestBody
     * @returns FinalizeParlayResultsResponseData Successful Response
     * @throws ApiError
     */
    public static finalizeParlayResult(
        parlayId: number,
        requestBody: FinalizeParlayResultsRequestData,
    ): CancelablePromise<FinalizeParlayResultsResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/parlays/{parlay_id}/finalize_results',
            path: {
                'parlay_id': parlayId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Close Parlay
     * @param parlayId
     * @param requestBody
     * @returns CloseParlayResponseData Successful Response
     * @throws ApiError
     */
    public static closeParlay(
        parlayId: number,
        requestBody: CloseParlayRequestData,
    ): CancelablePromise<CloseParlayResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/parlays/{parlay_id}/close',
            path: {
                'parlay_id': parlayId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Reopen Parlay
     * @param parlayId
     * @param requestBody
     * @returns ReopenParlayResponseData Successful Response
     * @throws ApiError
     */
    public static reopenParlay(
        parlayId: number,
        requestBody: ReopenParlayRequestData,
    ): CancelablePromise<ReopenParlayResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/parlays/{parlay_id}/reopen',
            path: {
                'parlay_id': parlayId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Swap Parlay Order
     * @param requestBody
     * @returns SwapParlayOrderResponseData Successful Response
     * @throws ApiError
     */
    public static swapParlayOrder(
        requestBody: SwapParlayOrderRequestData,
    ): CancelablePromise<SwapParlayOrderResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/parlays/swap_order',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
