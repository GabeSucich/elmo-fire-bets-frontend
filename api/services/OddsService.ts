/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SlateResponseData } from '../models/SlateResponseData';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OddsService {
    /**
     * Get Slate Lines
     * Every player priced for the games on one date.
     *
     * Served from a cache that refetches only once it is a quarter of an hour old, so five
     * people opening the same slate costs one call rather than five — which is what keeps the
     * monthly budget intact.
     *
     * An empty players list is a real answer, not a failure: a date with no games, one too
     * far ahead to be priced, or a slate already played all look like this.
     * @param date
     * @returns SlateResponseData Successful Response
     * @throws ApiError
     */
    public static getSlateLines(
        date: string,
    ): CancelablePromise<SlateResponseData> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/odds/slate/{date}',
            path: {
                'date': date,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
