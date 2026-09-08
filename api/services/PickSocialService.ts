/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ListPickCommentsResponseData } from '../models/ListPickCommentsResponseData';
import type { PickCommentRequestData } from '../models/PickCommentRequestData';
import type { PickCommentResponse } from '../models/PickCommentResponse';
import type { PickResponse } from '../models/PickResponse';
import type { ReactionRequestData } from '../models/ReactionRequestData';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PickSocialService {
    /**
     * React To Pick
     * Toggle one emoji on one pick.
     *
     * Unlike a feedback vote there is no single row per gambler to overwrite: several
     * different emoji may stand at once, so this only ever adds or removes the one sent.
     *
     * Returns the whole pick so the client patches one object and the chips on the card and
     * in the open drawer — the same array — move together.
     * @param pickId
     * @param requestBody
     * @returns PickResponse Successful Response
     * @throws ApiError
     */
    public static reactToPick(
        pickId: number,
        requestBody: ReactionRequestData,
    ): CancelablePromise<PickResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/picks/{pick_id}/reactions',
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
     * List Pick Comments
     * The thread, in full or from a cursor.
     *
     * Readable whatever the parlay's state: a closed pick's argument is part of its record.
     * @param pickId
     * @param after Only replies created after this. Send back a created_at from a previous response verbatim; used by the open drawer to poll for new replies.
     * @returns ListPickCommentsResponseData Successful Response
     * @throws ApiError
     */
    public static listPickComments(
        pickId: number,
        after?: (string | null),
    ): CancelablePromise<ListPickCommentsResponseData> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/picks/{pick_id}/comments',
            path: {
                'pick_id': pickId,
            },
            query: {
                'after': after,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Pick Comment
     * @param pickId
     * @param requestBody
     * @returns PickCommentResponse Successful Response
     * @throws ApiError
     */
    public static createPickComment(
        pickId: number,
        requestBody: PickCommentRequestData,
    ): CancelablePromise<PickCommentResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/picks/{pick_id}/comments',
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
     * Update Pick Comment
     * @param commentId
     * @param requestBody
     * @returns PickCommentResponse Successful Response
     * @throws ApiError
     */
    public static updatePickComment(
        commentId: number,
        requestBody: PickCommentRequestData,
    ): CancelablePromise<PickCommentResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/picks/comments/{comment_id}',
            path: {
                'comment_id': commentId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Pick Comment
     * @param commentId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deletePickComment(
        commentId: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/picks/comments/{comment_id}',
            path: {
                'comment_id': commentId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
