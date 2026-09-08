/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Everyone who left one emoji on one pick.
 *
 * The ids rather than a count, deliberately. The season context already has every
 * gambler by id, so the client derives the count, whether the reader is in it, and the
 * names for the drawer from this one field — which is why PickResponseData.from_model
 * needs no notion of who is asking, and why "who reacted" needs no second request.
 * A league is a handful of people; the list is smaller than a count plus a viewer flag.
 */
export type PickReactionResponseData = {
    emoji: string;
    gambler_ids: Array<number>;
};

