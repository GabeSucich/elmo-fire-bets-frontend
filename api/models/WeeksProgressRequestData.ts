/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { WeekEntry } from './WeekEntry';
/**
 * Several weeks at once, so catching up a whole season is one request rather than
 * one per week — each of which would otherwise re-derive and re-send the progress.
 */
export type WeeksProgressRequestData = {
    weeks: Array<WeekEntry>;
};

