import { PickResponseData, PickVetoResponseData, VetoApprovalStatus } from "@/api";
import React from "react";
import { Text, View } from "react-native";
import VetoProgress from "./VetoProgress";
import ActionButton from "../../reusable/ActionButton";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import VetoPickDisplay from "./VetoPickDisplay";

type Props = {
    pick: PickResponseData
    veto: PickVetoResponseData
    vetoerName: string
    vetoeeName: string
    remainingAffirmativeVotesNeeded: number
    remainingNonAffirmativeVotesNeeded: number
    handleVote: (affirmative: boolean) => void
}

export default function VotableVeto(props: Props) {
    const { pick, veto, vetoerName, vetoeeName, remainingAffirmativeVotesNeeded, remainingNonAffirmativeVotesNeeded, handleVote } = props
    const status = veto.approval_status

    const { gamblerId } = useGamblingSeasonContext()

    const isMyVeto = gamblerId === veto.gambler_id
    const isMyPick = gamblerId === pick.gambler_id

    const myVoteIsAffirmative = veto.votes.some(v => v.gambler_id === gamblerId && v.affirmative)
    const myVoteIsNegative = veto.votes.some(v => v.gambler_id === gamblerId && !v.affirmative)

    if (status === VetoApprovalStatus.APPROVED || status === VetoApprovalStatus.REJECTED) {
        return null
    }

    if (status === VetoApprovalStatus.UNDECIDED) {
        return (
            <View style={{ padding: 12 }}>
                <Text style={{ fontSize: 14, color: '#333', textAlign: 'center' }}>
                    The parlay was locked before a decision could be made on this veto. It will not take effect on the parlay.
                </Text>
            </View>
        )
    }

    if (status === VetoApprovalStatus.PENDING) {
        return (
            <View style={{ padding: 12 }}>
                <VetoPickDisplay veto={veto} pick={pick} vetoeeName={vetoeeName} vetoerName={vetoerName}/>
                <VetoProgress
                    veto={veto}
                />
                {
                    !isMyPick && !isMyVeto && (
                        <View>
                            <Text style={{ fontSize: 12, color: '#333', textAlign: 'center', marginTop: 12, fontWeight: 'bold', fontStyle: 'italic' }}>
                                Once you submit a vote, you may change it, but you cannot remove your vote altogether.
                            </Text>
                            {remainingAffirmativeVotesNeeded === 1 && !myVoteIsAffirmative && (
                                <Text style={{ fontSize: 13, color: '#16a34a', textAlign: 'center', marginTop: 12, fontWeight: 'bold' }}>
                                    If you vote to approve this veto, it will permanently take effect!
                                </Text>
                            )}
                            {remainingNonAffirmativeVotesNeeded === 1 && !myVoteIsNegative && (
                                <Text style={{ fontSize: 13, color: '#dc2626', textAlign: 'center', marginTop: 12, fontWeight: 'bold' }}>
                                    If you vote to reject this veto, it will permanently take effect!
                                </Text>
                            )}
                            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 16 }}>
                                <ActionButton text="Reject" onPress={() => handleVote(false)} disabled={myVoteIsNegative} color="#dc2626" />
                                <ActionButton text="Approve" onPress={() => handleVote(true)} disabled={myVoteIsAffirmative} color="#16a34a" />
                            </View>
                        </View>
                        
                    )
                }
            </View>
        )
    }

    return null
}
