/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BetTypeMetrics } from './BetTypeMetrics';
import type { DirectionMetrics } from './DirectionMetrics';
import type { PropTargetMetrics } from './PropTargetMetrics';
import type { SauceFactorMetrics } from './SauceFactorMetrics';
import type { SetMetrics } from './SetMetrics';
import type { SetVetoMetrics } from './SetVetoMetrics';
import type { SlateFilteredMetrics } from './SlateFilteredMetrics';
export type GamblerAdvancedMetrics = {
    overall: SetMetrics;
    TD: SetMetrics;
    non_TD: SetMetrics;
    non_TD_slate: SlateFilteredMetrics;
    TD_slate: SlateFilteredMetrics;
    sauce_factor: SauceFactorMetrics;
    direction: DirectionMetrics;
    veto_metrics: SetVetoMetrics;
    bet_types: BetTypeMetrics;
    prop_target_metrics: PropTargetMetrics;
};

