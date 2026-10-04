/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ParlayAssessmentResponseData } from '../models/ParlayAssessmentResponseData';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AssessmentsService {
    /**
     * Get Parlay Assessment
     * @param parlayId
     * @returns ParlayAssessmentResponseData Successful Response
     * @throws ApiError
     */
    public static getParlayAssessment(
        parlayId: number,
    ): CancelablePromise<ParlayAssessmentResponseData> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/parlays/{parlay_id}/assessment',
            path: {
                'parlay_id': parlayId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Request Parlay Assessment
     * @param parlayId
     * @returns ParlayAssessmentResponseData Successful Response
     * @throws ApiError
     */
    public static requestParlayAssessment(
        parlayId: number,
    ): CancelablePromise<ParlayAssessmentResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/parlays/{parlay_id}/assessment',
            path: {
                'parlay_id': parlayId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
