/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * One point on the score line.
 *
 * Deliberately does not carry metrics. It used to embed a full GamblerBaseMetrics per
 * point, which meant a season shipped megabytes of per-target and per-prop breakdowns
 * to draw a line the client renders from corrected_score alone.
 */
export type TimeSeriesDatum = {
    gambler_id: number;
    parlay_order: number;
    parlay_id: number;
    corrected_score: number;
};

