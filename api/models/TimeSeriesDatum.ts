/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GamblerBaseMetrics } from './GamblerBaseMetrics';
export type TimeSeriesDatum = {
    gambler_id: number;
    parlay_order: number;
    parlay_id: number;
    metrics: GamblerBaseMetrics;
    corrected_score: number;
};

