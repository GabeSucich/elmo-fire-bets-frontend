/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PropBetDirection } from './PropBetDirection';
import type { PropBetType } from './PropBetType';
/**
 * One gambler's reason this pick is on one list.
 *
 * At most one per gambler per list, even where several of their entries catch the same
 * bet — "Jamarr Chase" and "Jamarr Chase / Rec Yards / Over" both match the same pick,
 * and naming the same person twice in the drawer says nothing the first line did not.
 * The narrower entry is the one kept: it is the one that describes this bet.
 */
export type PickListPlacementEntryResponseData = {
    gambler_id: number;
    prop_type: (PropBetType | null);
    direction: (PropBetDirection | null);
};

