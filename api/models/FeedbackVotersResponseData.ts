/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Who voted, by first name.
 *
 * Kept off the list response: it is a handful of names per suggestion and the cards show
 * only the total, so fetching them for every row to render none of them would be waste.
 */
export type FeedbackVotersResponseData = {
    up: Array<string>;
    down: Array<string>;
};

