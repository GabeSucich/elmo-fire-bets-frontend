/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DirectionMetrics } from './DirectionMetrics';
import type { SauceFactorMetrics } from './SauceFactorMetrics';
import type { SetMetrics } from './SetMetrics';
import type { SetVetoMetrics } from './SetVetoMetrics';
export type GamblerBaseMetrics = {
    overall: SetMetrics;
    TD: SetMetrics;
    non_TD: SetMetrics;
    sauce_factor: SauceFactorMetrics;
    direction: DirectionMetrics;
    veto_metrics: SetVetoMetrics;
};

