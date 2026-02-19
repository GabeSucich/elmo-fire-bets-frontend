/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { VetoApprovalStatus } from './VetoApprovalStatus';
import type { VetoResult } from './VetoResult';
import type { VetoVoteResponseData } from './VetoVoteResponseData';
export type PickVetoResponseData = {
    id: number;
    pick_id: number;
    gambler_id: number;
    approval_status: VetoApprovalStatus;
    result: (VetoResult | null);
    votes: Array<VetoVoteResponseData>;
};

