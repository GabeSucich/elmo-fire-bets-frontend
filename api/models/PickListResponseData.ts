/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PickListItemResponseData } from './PickListItemResponseData';
import type { PickListType } from './PickListType';
export type PickListResponseData = {
    id: number;
    gambling_season_id: number;
    list_type: PickListType;
    display_name: string;
    items: Array<PickListItemResponseData>;
};

