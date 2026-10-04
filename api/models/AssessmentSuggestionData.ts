/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ConcernTag } from './ConcernTag';
import type { SignalStrength } from './SignalStrength';
export type AssessmentSuggestionData = {
    title: string;
    description: string;
    signal?: (SignalStrength | null);
    tag?: (ConcernTag | null);
};

