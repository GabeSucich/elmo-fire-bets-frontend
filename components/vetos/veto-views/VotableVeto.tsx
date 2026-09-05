import { PickResponseData, PickVetoResponseData, VetoApprovalStatus, VetoesService } from "@/api";
import React from "react";
import { Text, View } from "react-native";
import VetoProgress from "./VetoProgress";
import ActionButton from "../../reusable/ActionButton";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import VetoPickDisplay from "./VetoPickDisplay";
import { useLoadingState } from "@/composables/useLoadingState";
import useApiActionState from "@/composables/useApiActionState";
import OverlayLoader from "../../reusable/OverlayLoader";
import { colors, typography, spacing } from "@/theme/colors";

type Props = {
    pick: PickResponseData
    veto: PickVetoResponseData
    vetoerName: string
    vetoeeName: string
    remainingAffirmativeVotesNeeded: number
    remainingNonAffirmativeVotesNeeded: number
    onSubmitVote: () => void
}

export default function VotableVeto(props: Props) {
    const { pick, veto, vetoerName, vetoeeName, remainingAffirmativeVotesNeeded, remainingNonAffirmativeVotesNeeded } = props
    const status = veto.approval_status

    const {
        loading, setLoading
    } = useLoadingState()

    const { gamblerId } = useGamblingSeasonContext()

    const isMyVeto = gamblerId === veto.gambler_id
    const isMyPick = gamblerId === pick.gambler_id

    const myVoteIsAffirmative = veto.votes.some(v => v.gambler_id === gamblerId && v.affirmative)
    const myVoteIsNegative = veto.votes.some(v => v.gambler_id === gamblerId && !v.affirmative)

    const {
        execute: submitVote
    } = useApiActionState(
        (affirmative: boolean) => VetoesService.submitVetoVote(props.veto.id, {
            affirmative,
            gambler_id: gamblerId
        }),
        res => props.onSubmitVote(),
        setLoading,
        "There was an error submitting your vote"
    )

    if (status === VetoApprovalStatus.APPROVED || status === VetoApprovalStatus.REJECTED) {
        return null
    }

    if (status === VetoApprovalStatus.UNDECIDED) {
        return (
            <View style={{ padding: spacing.md }}>
                <Text style={{ ...typography.body, color: colors.textSecondary, textAlign: 'center' }}>
                    The parlay was locked before a decision could be made on this veto. It will not take effect on the parlay.
                </Text>
            </View>
        )
    }

    if (status === VetoApprovalStatus.PENDING) {
        return (
            <View style={{ padding: spacing.md }}>
                {loading && <OverlayLoader />}
                <VetoPickDisplay veto={veto} pick={pick} vetoeeName={vetoeeName} vetoerName={vetoerName}/>
                <VetoProgress
                    veto={veto}
                />
                {
                    !isMyPick && !isMyVeto && (
                        <View>
                            <Text style={{
                                ...typography.caption,
                                color: colors.textSecondary,
                                textAlign: 'center',
                                marginTop: spacing.md,
                                fontWeight: 'bold',
                                fontStyle: 'italic',
                            }}>
                                Once you submit a vote, you may change it, but you cannot remove your vote altogether.
                            </Text>
                            {remainingAffirmativeVotesNeeded === 1 && !myVoteIsAffirmative && (
                                <Text style={{
                                    ...typography.caption,
                                    color: colors.success,
                                    textAlign: 'center',
                                    marginTop: spacing.md,
                                    fontWeight: 'bold',
                                }}>
                                    If you vote to approve this veto, it will permanently take effect!
                                </Text>
                            )}
                            {remainingNonAffirmativeVotesNeeded === 1 && !myVoteIsNegative && (
                                <Text style={{
                                    ...typography.caption,
                                    color: colors.danger,
                                    textAlign: 'center',
                                    marginTop: spacing.md,
                                    fontWeight: 'bold',
                                }}>
                                    If you vote to reject this veto, it will permanently take effect!
                                </Text>
                            )}
                            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginTop: spacing.lg }}>
                                <ActionButton text="Reject" onPress={() => submitVote(false)} disabled={myVoteIsNegative} color={colors.danger} />
                                <ActionButton text="Approve" onPress={() => submitVote(true)} disabled={myVoteIsAffirmative} color={colors.success} />
                            </View>
                        </View>

                    )
                }
            </View>
        )
    }

    return null
}
