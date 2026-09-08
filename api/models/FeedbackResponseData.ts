/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FeedbackStatus } from './FeedbackStatus';
export type FeedbackResponseData = {
    id: number;
    gambler_id: number;
    author_name: string;
    title: string;
    comment: string;
    status: FeedbackStatus;
    created_at: string;
    score: number;
    comment_count: number;
    viewer_vote: number;
    viewer_is_author: boolean;
};

