/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * The model's proposal for one pick.
 *
 * There is deliberately no field capable of expressing a target or prop-type
 * change: the "only the number moves" rule is enforced by this shape rather
 * than by prompt compliance.
 */
export type CorrectionSuggestion = {
    pick_id: number;
    matched_leg_index: (number | null);
    suggested_number: (number | null);
    direction_mismatch: boolean;
    loose_target_match: boolean;
    note: (string | null);
};

