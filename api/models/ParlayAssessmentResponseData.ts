/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssessmentSlotData } from './AssessmentSlotData';
export type ParlayAssessmentResponseData = {
    can_request: boolean;
    request_blocked_reason: (string | null);
    picks: Array<AssessmentSlotData>;
    parlay: AssessmentSlotData;
};

