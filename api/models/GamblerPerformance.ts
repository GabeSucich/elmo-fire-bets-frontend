/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GamblerAdvancedMetrics } from './GamblerAdvancedMetrics';
import type { ScoreCorrection } from './ScoreCorrection';
export type GamblerPerformance = {
    gambler_id: number;
    corrected_score: number;
    metrics: GamblerAdvancedMetrics;
    deductions: Record<string, ScoreCorrection>;
    augmentations: Record<string, ScoreCorrection>;
};

