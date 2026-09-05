/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ExtractCorrectionLegsRequestData } from '../models/ExtractCorrectionLegsRequestData';
import type { ExtractCorrectionLegsResponseData } from '../models/ExtractCorrectionLegsResponseData';
import type { MatchCorrectionLegsRequestData } from '../models/MatchCorrectionLegsRequestData';
import type { MatchCorrectionLegsResponseData } from '../models/MatchCorrectionLegsResponseData';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CorrectionsService {
    /**
     * Extract Correction Legs
     * @param parlayId
     * @param requestBody
     * @returns ExtractCorrectionLegsResponseData Successful Response
     * @throws ApiError
     */
    public static extractCorrectionLegs(
        parlayId: number,
        requestBody: ExtractCorrectionLegsRequestData,
    ): CancelablePromise<ExtractCorrectionLegsResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/parlays/{parlay_id}/correction_analysis/extract',
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
     * Match Correction Legs
     * @param parlayId
     * @param requestBody
     * @returns MatchCorrectionLegsResponseData Successful Response
     * @throws ApiError
     */
    public static matchCorrectionLegs(
        parlayId: number,
        requestBody: MatchCorrectionLegsRequestData,
    ): CancelablePromise<MatchCorrectionLegsResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/parlays/{parlay_id}/correction_analysis/match',
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
}
