/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PickListPlacementEntryResponseData } from './PickListPlacementEntryResponseData';
import type { PickListType } from './PickListType';
/**
 * A pick's standing on one of the season's lists.
 *
 * One of these per list the pick lands on, carrying a row per gambler rather than a
 * count — the same trade PickReactionResponseData makes. The season context already has
 * every gambler by id, so the badge's number, whether the reader is among them and the
 * names in the drawer all come off this with no second request.
 */
export type PickListPlacementResponseData = {
    pick_list_id: number;
    list_type: PickListType;
    display_name: string;
    entries: Array<PickListPlacementEntryResponseData>;
};

