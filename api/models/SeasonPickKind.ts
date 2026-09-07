/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Season-long picks come in two shapes. Team win totals deliberately have no
 * PropBetType member, which is what keeps them out of the parlay pick picker.
 */
export enum SeasonPickKind {
    PLAYER_PROP = 'Player prop',
    TEAM_WINS = 'Team wins',
}
