/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssessedPickData } from './AssessedPickData';
import type { AssessmentSuggestionData } from './AssessmentSuggestionData';
import type { SlotStatus } from './SlotStatus';
export type AssessmentSlotData = {
    pick_id: (number | null);
    status: SlotStatus;
    suggestions: Array<AssessmentSuggestionData>;
    assessed_at: (string | null);
    assessed_against: Array<AssessedPickData>;
};

