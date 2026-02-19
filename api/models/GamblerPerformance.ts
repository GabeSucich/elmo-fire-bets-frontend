/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GamblerBaseMetrics } from './GamblerBaseMetrics';
import type { ScoreCorrection } from './ScoreCorrection';
export type GamblerPerformance = {
    gambler_id: number;
    corrected_score: number;
    metrics: GamblerBaseMetrics;
    deductions: Record<string, ScoreCorrection>;
    augmentations: Record<string, ScoreCorrection>;
};

