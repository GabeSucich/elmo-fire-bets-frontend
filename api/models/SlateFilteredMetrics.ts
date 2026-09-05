/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SauceFactorMetrics } from './SauceFactorMetrics';
import type { SetMetrics } from './SetMetrics';
export type SlateFilteredMetrics = {
    overall: SetMetrics;
    sauce_factor: SauceFactorMetrics;
    bet_types: Record<string, SetMetrics>;
    prop_targets: Record<string, SetMetrics>;
    target_names: Record<string, string>;
};

