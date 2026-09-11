import React, { useState } from "react"
import { ParlayResponseData } from "@/api"
import ActionButton from "@/components/reusable/ActionButton"
import PayoutEditorModal from "./modals/PayoutEditorModal"
import { useParlaysContext } from "@/contexts/parlaysContext"
import { colors } from "@/theme/colors"

type Props = {
    parlay: ParlayResponseData
}

/**
 * The way in to what a lay pays.
 *
 * Blue and inviting while the figure is missing, because a lay with no payout cannot be
 * reported on at all — the card just says so. Once it is there the button loses its verb
 * along with its colour: editing one is housekeeping, and the bare mark is enough to find
 * it again without competing with the buttons that still want pressing.
 */
export default function PayoutButton({ parlay }: Props) {
    const [visible, setVisible] = useState(false)
    const { updateParlay } = useParlaysContext()
    const missing = parlay.payout_pp === null

    return (
        <>
            <ActionButton
                text={missing ? "+$" : "$"}
                onPress={() => setVisible(true)}
                color={missing ? colors.accent : colors.buttonSecondary}
            />
            <PayoutEditorModal
                visible={visible}
                parlay={parlay}
                onClose={() => setVisible(false)}
                onSave={payoutPerPerson => {
                    setVisible(false)
                    updateParlay({
                        parlay_id: parlay.id,
                        competition_date: null,
                        owner_id: null,
                        slate_type: null,
                        wager_pp: null,
                        payout_pp: payoutPerPerson,
                    })
                }}
            />
        </>
    )
}
