/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreatePickVetoRequestData } from '../models/CreatePickVetoRequestData';
import type { CreatePickVetoResponseData } from '../models/CreatePickVetoResponseData';
import type { DeleteVetoResponseData } from '../models/DeleteVetoResponseData';
import type { SubmitVetoVoteRequestData } from '../models/SubmitVetoVoteRequestData';
import type { SubmitVetoVoteResponseData } from '../models/SubmitVetoVoteResponseData';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class VetoesService {
    /**
     * Create Pick Veto
     * @param requestBody
     * @returns CreatePickVetoResponseData Successful Response
     * @throws ApiError
     */
    public static createPickVeto(
        requestBody: CreatePickVetoRequestData,
    ): CancelablePromise<CreatePickVetoResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/vetoes/',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Submit Veto Vote
     * @param vetoId
     * @param requestBody
     * @returns SubmitVetoVoteResponseData Successful Response
     * @throws ApiError
     */
    public static submitVetoVote(
        vetoId: number,
        requestBody: SubmitVetoVoteRequestData,
    ): CancelablePromise<SubmitVetoVoteResponseData> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/vetoes/{veto_id}/vote',
            path: {
                'veto_id': vetoId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Veto
     * @param vetoId
     * @returns DeleteVetoResponseData Successful Response
     * @throws ApiError
     */
    public static deleteVeto(
        vetoId: number,
    ): CancelablePromise<DeleteVetoResponseData> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/vetoes/{veto_id}',
            path: {
                'veto_id': vetoId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
