/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SauceFactorMetrics } from './SauceFactorMetrics';
import type { SetMetrics } from './SetMetrics';
import type { SetVetoMetrics } from './SetVetoMetrics';
/**
 * The sample a season's rules actually score on.
 *
 * Both the whole-season metrics and a single slate bucket carry these three fields,
 * so a corrector can return either and the client renders it without needing to know
 * which. Keeps the stats shown beside a score from disagreeing with it.
 */
export type ScoredMetrics = {
    overall: SetMetrics;
    sauce_factor: SauceFactorMetrics;
    veto_metrics: SetVetoMetrics;
};

