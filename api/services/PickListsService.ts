/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeletePickListItemResponseData } from '../models/DeletePickListItemResponseData';
import type { ListPickListsResponseData } from '../models/ListPickListsResponseData';
import type { PickListItemRequestData } from '../models/PickListItemRequestData';
import type { PickListItemResponse } from '../models/PickListItemResponse';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PickListsService {
    /**
     * List Pick Lists
     * @param seasonId
     * @returns ListPickListsResponseData Successful Response
     * @throws ApiError
     */
    public static listPickLists(
        seasonId: number,
    ): CancelablePromise<ListPickListsResponseData> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/pick_lists/season/{season_id}',
            path: {
                'season_id': seasonId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Create Pick List Item
     * @param pickListId
     * @param requestBody
     * @returns PickListItemResponse Successful Response
     * @throws ApiError
     */
    public static createPickListItem(
        pickListId: number,
        requestBody: PickListItemRequestData,
    ): CancelablePromise<PickListItemResponse> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/pick_lists/{pick_list_id}/items',
            path: {
                'pick_list_id': pickListId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Update Pick List Item
     * @param itemId
     * @param requestBody
     * @returns PickListItemResponse Successful Response
     * @throws ApiError
     */
    public static updatePickListItem(
        itemId: number,
        requestBody: PickListItemRequestData,
    ): CancelablePromise<PickListItemResponse> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/pick_lists/items/{item_id}',
            path: {
                'item_id': itemId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Delete Pick List Item
     * @param itemId
     * @returns DeletePickListItemResponseData Successful Response
     * @throws ApiError
     */
    public static deletePickListItem(
        itemId: number,
    ): CancelablePromise<DeletePickListItemResponseData> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/pick_lists/items/{item_id}',
            path: {
                'item_id': itemId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
