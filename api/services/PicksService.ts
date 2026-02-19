/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreatePickRequestData } from '../models/CreatePickRequestData';
import type { CreatePickResponseData } from '../models/CreatePickResponseData';
import type { OverridePickRequestData } from '../models/OverridePickRequestData';
import type { OverridePickResponseData } from '../models/OverridePickResponseData';
import type { UpdatePickRequestData } from '../models/UpdatePickRequestData';
import type { UpdatePickResponseData } from '../models/UpdatePickResponseData';
import type { UpdatePickResultRequestData } from '../models/UpdatePickResultRequestData';
import type { UpdatePickResultResponseData } from '../models/UpdatePickResultResponseData';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PicksService {
    /**
     * Create Pick
     * @param requestBody
     * @returns CreatePickResponseData Successful Response
     * @throws ApiError
     */
    public static createPick(
        requestBody: CreatePickRequestData,
    ): CancelablePromise<CreatePickResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/picks/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Pick
     * @param pickId
     * @param requestBody
     * @returns UpdatePickResponseData Successful Response
     * @throws ApiError
     */
    public static updatePick(
        pickId: number,
        requestBody: UpdatePickRequestData,
    ): CancelablePromise<UpdatePickResponseData> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/picks/{pick_id}',
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
     * Apply Pick Override
     * @param pickId
     * @param requestBody
     * @returns OverridePickResponseData Successful Response
     * @throws ApiError
     */
    public static applyPickOverride(
        pickId: number,
        requestBody: OverridePickRequestData,
    ): CancelablePromise<OverridePickResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/picks/{pick_id}/override',
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
     * Update Pick Result
     * @param pickId
     * @param requestBody
     * @returns UpdatePickResultResponseData Successful Response
     * @throws ApiError
     */
    public static updatePickResult(
        pickId: number,
        requestBody: UpdatePickResultRequestData,
    ): CancelablePromise<UpdatePickResultResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/picks/{pick_id}/result',
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
}
