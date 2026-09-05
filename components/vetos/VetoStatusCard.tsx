import { PickResponseData, PickVetoResponseData, VetoApprovalStatus } from "@/api";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import React from "react";
import VotableVeto from "./veto-views/VotableVeto";
import VetoPickDisplay from "./veto-views/VetoPickDisplay";
import MyVeto from "./veto-views/MyVeto";

type Props = {
    pick: PickResponseData
    veto: PickVetoResponseData
    gamblerId: number
    onDeleteVeto: () => void
    onSubmitVote: () => void
}

export default function VetoStatusCard(props: Props) {
    const {
        gamblerId,
        gamblers
    } = useGamblingSeasonContext()

    const vetoerName = gamblers[props.veto.gambler_id].firstName
    const vetoeeName = gamblers[props.pick.gambler_id].firstName
    const amVetoer = props.veto.gambler_id === gamblerId
    const gamblerCount = Object.keys(gamblers).length
    const affirmativeVotesNeeded = Math.floor(gamblerCount / 2)
    const nonAffirmativeVotesNeeded = Math.floor(gamblerCount / 2)

    const affirmativeVoteCount = props.veto.votes.filter(v => v.affirmative).length
    const nonAffirmativeVoteCount = props.veto.votes.filter(v => !v.affirmative).length

    const remainingAffirmativeVotesNeeded = affirmativeVotesNeeded - affirmativeVoteCount
    const reaminingNonAffirmativeVotesNeeded = nonAffirmativeVotesNeeded - nonAffirmativeVoteCount

    if (props.pick.veto?.approval_status === VetoApprovalStatus.APPROVED) {
        return <VetoPickDisplay 
            pick={props.pick} 
            veto={props.pick.veto}
            vetoerName={vetoerName}
            vetoeeName={vetoeeName}
        />
    }

    if (amVetoer) {
        return <MyVeto 
            pick={props.pick} 
            veto={props.veto} 
            vetoeeName={vetoeeName} 
            vetoerName={vetoerName}
            onDelete={props.onDeleteVeto}
        />
    }

    return <VotableVeto
        pick={props.pick}
        veto={props.veto}
        vetoerName={vetoerName}
        vetoeeName={vetoeeName}
        remainingAffirmativeVotesNeeded={remainingAffirmativeVotesNeeded}
        remainingNonAffirmativeVotesNeeded={reaminingNonAffirmativeVotesNeeded}
        onSubmitVote={props.onSubmitVote}
    />

}
