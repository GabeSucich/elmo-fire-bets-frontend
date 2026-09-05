/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DirectionMetrics } from './DirectionMetrics';
import type { SauceFactorMetrics } from './SauceFactorMetrics';
import type { SetMetrics } from './SetMetrics';
import type { SetVetoMetrics } from './SetVetoMetrics';
import type { SlateFilteredMetrics } from './SlateFilteredMetrics';
export type GamblerBaseMetrics = {
    overall: SetMetrics;
    TD: SetMetrics;
    non_TD: SetMetrics;
    non_TD_slate: SlateFilteredMetrics;
    TD_slate: SlateFilteredMetrics;
    sauce_factor: SauceFactorMetrics;
    direction: DirectionMetrics;
    veto_metrics: SetVetoMetrics;
};

