/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GamblerAdvancedMetrics } from './GamblerAdvancedMetrics';
import type { ScoreCorrection } from './ScoreCorrection';
import type { ScoredMetrics } from './ScoredMetrics';
export type GamblerPerformance = {
    gambler_id: number;
    corrected_score: number;
    metrics: GamblerAdvancedMetrics;
    scored_metrics: ScoredMetrics;
    deductions: Record<string, ScoreCorrection>;
    augmentations: Record<string, ScoreCorrection>;
};

