/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CommentRequestData } from '../models/CommentRequestData';
import type { CommentResponse } from '../models/CommentResponse';
import type { FeedbackRequestData } from '../models/FeedbackRequestData';
import type { FeedbackResponse } from '../models/FeedbackResponse';
import type { FeedbackVotersResponseData } from '../models/FeedbackVotersResponseData';
import type { ListFeedbackCommentsResponseData } from '../models/ListFeedbackCommentsResponseData';
import type { ListFeedbackResponseData } from '../models/ListFeedbackResponseData';
import type { StatusRequestData } from '../models/StatusRequestData';
import type { UpdateFeedbackRequestData } from '../models/UpdateFeedbackRequestData';
import type { VoteRequestData } from '../models/VoteRequestData';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FeedbackService {
    /**
     * List Feedback
     * Everything at once, open and resolved.
     *
     * There will never be many, and the client splits them by tab and by age. Comments are
     * the expensive part and are left until a suggestion is opened.
     * @param seasonId
     * @returns ListFeedbackResponseData Successful Response
     * @throws ApiError
     */
    public static listFeedback(
        seasonId: number,
    ): CancelablePromise<ListFeedbackResponseData> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/feedback/season/{season_id}',
            path: {
                'season_id': seasonId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Feedback
     * @param seasonId
     * @param requestBody
     * @returns FeedbackResponse Successful Response
     * @throws ApiError
     */
    public static createFeedback(
        seasonId: number,
        requestBody: FeedbackRequestData,
    ): CancelablePromise<FeedbackResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/feedback/season/{season_id}',
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
     * Update Feedback
     * @param feedbackId
     * @param requestBody
     * @returns FeedbackResponse Successful Response
     * @throws ApiError
     */
    public static updateFeedback(
        feedbackId: number,
        requestBody: UpdateFeedbackRequestData,
    ): CancelablePromise<FeedbackResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/feedback/{feedback_id}',
            path: {
                'feedback_id': feedbackId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Feedback
     * @param feedbackId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteFeedback(
        feedbackId: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/feedback/{feedback_id}',
            path: {
                'feedback_id': feedbackId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Set Feedback Status
     * Resolve, retire, or put one back into the open list.
     *
     * Deliberately not guarded by require_open: reopening is the whole point of being able
     * to change a status, and an admin who retires something by mistake needs a way back.
     * @param feedbackId
     * @param requestBody
     * @returns FeedbackResponse Successful Response
     * @throws ApiError
     */
    public static setFeedbackStatus(
        feedbackId: number,
        requestBody: StatusRequestData,
    ): CancelablePromise<FeedbackResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/feedback/{feedback_id}/status',
            path: {
                'feedback_id': feedbackId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Vote On Feedback
     * @param feedbackId
     * @param requestBody
     * @returns FeedbackResponse Successful Response
     * @throws ApiError
     */
    public static voteOnFeedback(
        feedbackId: number,
        requestBody: VoteRequestData,
    ): CancelablePromise<FeedbackResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/feedback/{feedback_id}/vote',
            path: {
                'feedback_id': feedbackId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Feedback Votes
     * Readable whatever the status: a settled suggestion's votes are part of its record.
     * @param feedbackId
     * @returns FeedbackVotersResponseData Successful Response
     * @throws ApiError
     */
    public static listFeedbackVotes(
        feedbackId: number,
    ): CancelablePromise<FeedbackVotersResponseData> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/feedback/{feedback_id}/votes',
            path: {
                'feedback_id': feedbackId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * List Feedback Comments
     * @param feedbackId
     * @returns ListFeedbackCommentsResponseData Successful Response
     * @throws ApiError
     */
    public static listFeedbackComments(
        feedbackId: number,
    ): CancelablePromise<ListFeedbackCommentsResponseData> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/feedback/{feedback_id}/comments',
            path: {
                'feedback_id': feedbackId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Feedback Comment
     * @param feedbackId
     * @param requestBody
     * @returns CommentResponse Successful Response
     * @throws ApiError
     */
    public static createFeedbackComment(
        feedbackId: number,
        requestBody: CommentRequestData,
    ): CancelablePromise<CommentResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/feedback/{feedback_id}/comments',
            path: {
                'feedback_id': feedbackId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Feedback Comment
     * @param commentId
     * @param requestBody
     * @returns CommentResponse Successful Response
     * @throws ApiError
     */
    public static updateFeedbackComment(
        commentId: number,
        requestBody: CommentRequestData,
    ): CancelablePromise<CommentResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/feedback/comments/{comment_id}',
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
     * Delete Feedback Comment
     * @param commentId
     * @returns any Successful Response
     * @throws ApiError
     */
    public static deleteFeedbackComment(
        commentId: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/feedback/comments/{comment_id}',
            path: {
                'comment_id': commentId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
