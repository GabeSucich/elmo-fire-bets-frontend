/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { GamblerBaseMetrics } from './GamblerBaseMetrics';
import type { ScoreCorrection } from './ScoreCorrection';
import type { ScoredMetrics } from './ScoredMetrics';
export type GamblerPerformance = {
    gambler_id: number;
    corrected_score: number;
    metrics: GamblerBaseMetrics;
    scored_metrics: ScoredMetrics;
    deductions: Record<string, ScoreCorrection>;
    augmentations: Record<string, ScoreCorrection>;
};

