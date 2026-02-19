import { PickResponseData, PickVetoResponseData, VetoApprovalStatus, VetoesService } from "@/api";
import { useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext";
import React, { useState } from "react";
import VotableVeto from "./veto-views/VotableVeto";
import { setApiErrorMsg } from "@/util/error";
import VetoPickDisplay from "./veto-views/VetoPickDisplay";
import MyVeto from "./veto-views/MyVeto";

type Props = {
    pick: PickResponseData
    veto: PickVetoResponseData
    gamblerId: number
    onDeleteVeto: () => void
    onSubmitVote: (affirmative: boolean) => void
}

export default function VetoStatusCard(props: Props) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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

    function submitVetoVote(affirmative: boolean) {
        setLoading(true)
        setError(null)
        VetoesService.submitVetoVote(props.veto.id, {
            affirmative,
            gambler_id: gamblerId
        })
        .then(res => props.onSubmitVote(affirmative))
        .catch(e => setApiErrorMsg(e, setError, "There was an error submitting the vote"))
        .finally(() => setLoading(false))
    }

    function deleteVeto() {
        console.log("DELETING!")
        if (!amVetoer) return
        setLoading(true)
        setError(null)
        VetoesService.deleteVeto(props.veto.id)
            .then(res => props.onDeleteVeto())
            .catch(e => setApiErrorMsg(e, setError, "There was an error deleting the veto"))
            .finally(() => setLoading(false))
    }

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
            onDelete={deleteVeto}
        />
    }

    return <VotableVeto
        pick={props.pick}
        veto={props.veto}
        vetoerName={vetoerName}
        vetoeeName={vetoeeName}
        remainingAffirmativeVotesNeeded={remainingAffirmativeVotesNeeded}
        remainingNonAffirmativeVotesNeeded={reaminingNonAffirmativeVotesNeeded}
        handleVote={submitVetoVote}
    />

}
