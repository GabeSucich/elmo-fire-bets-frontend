import {
    AssessedPickData,
    AssessmentSlotData,
    ParlayAssessmentResponseData,
    PickResponseData,
    SlotStatus,
    VetoApprovalStatus,
} from "@/api"
import { SAUCE_EMOJI } from "@/util/picks"
import { formatLine } from "@/util/statFormat"

/** "Over 54.5 Rec Yards", as the pick stood when it was analyzed. */
export function describeAssessedPick(assessed: AssessedPickData): string {
    const sauce = assessed.sauce_factor ? ` ${SAUCE_EMOJI[assessed.sauce_factor]}` : ""
    const veto = assessed.vetoed ? " (Veto)" : ""
    return `${assessed.direction} ${formatLine(assessed.line)} ${assessed.prop_type}${sauce}${veto}`
}

/**
 * What is different about a pick now from when it was analyzed, in a few words each.
 *
 * The server already decided the analysis is stale — this only puts names to why, so a
 * card can say "line 54.5 → 49.5" instead of leaving the reader to spot it.
 */
export function changesSince(assessed: AssessedPickData, pick: PickResponseData): string[] {
    const changes: string[] = []
    const line = pick.corrected_line ?? pick.line
    if (assessed.player !== pick.prop_bet_target.player_name) {
        changes.push(`was ${assessed.player ?? "a team bet"}`)
    }
    if (assessed.prop_type !== pick.prop_type) {
        changes.push(`was ${assessed.prop_type}`)
    }
    if (assessed.direction !== pick.direction) {
        changes.push(`was the ${assessed.direction.toLowerCase()}`)
    }
    if (assessed.line !== line) {
        changes.push(`line ${formatLine(assessed.line)} → ${formatLine(line)}`)
    }
    if (assessed.sauce_factor !== pick.sauce_factor) {
        changes.push("sauce changed")
    }
    const vetoedNow = pick.veto?.approval_status === VetoApprovalStatus.APPROVED
    if (assessed.vetoed !== vetoedNow) {
        changes.push(vetoedNow ? "vetoed since" : "veto lifted since")
    }
    return changes
}

/**
 * The line under a slot's heading explaining why it reads the way it does, if it needs one.
 *
 * Only a stale slot gets one: what it was analyzed as, and what has changed since.
 */
export function slotNotice(slot: AssessmentSlotData, pick?: PickResponseData): string | null {
    switch (slot.status) {
        // Outdated needs no line either: the pick is unchanged, so its analysis still
        // stands, and the Re-analyze button already says there is something newer.
        case SlotStatus.FRESH:
        case SlotStatus.OUTDATED:
        case SlotStatus.MISSING:
            return null
        case SlotStatus.STALE: {
            if (!pick) {
                return "The slate has changed since it was analyzed."
            }
            const assessed = slot.assessed_against[0]
            if (!assessed) {
                return "This pick has changed since it was analyzed."
            }
            const changes = changesSince(assessed, pick)
            const what = changes.length ? ` (${changes.join(", ")})` : ""
            return `Analyzed as ${describeAssessedPick(assessed)}. The pick has changed since${what}.`
        }
    }
}

/**
 * Whether a slot gets a card. Only ones with something to say: concerns, or an analysis
 * about a pick that has since changed. Never analyzed and analyzed-with-no-concerns are
 * both left out rather than shown as empty cards.
 */
export function shouldShowSlot(slot: AssessmentSlotData): boolean {
    return slot.status === SlotStatus.STALE || slot.suggestions.length > 0
}

function allSlots(response: ParlayAssessmentResponseData): AssessmentSlotData[] {
    return [...response.picks, response.parlay]
}

export function hasAnyAssessment(response: ParlayAssessmentResponseData): boolean {
    return allSlots(response).some(slot => slot.status !== SlotStatus.MISSING)
}

/** Nothing analyzed yet, and allowed to be: opening the analysis should just start one. */
export function shouldAnalyzeAutomatically(response: ParlayAssessmentResponseData): boolean {
    return response.can_request && !hasAnyAssessment(response)
}

/**
 * Whether to offer "Re-analyze": something has been analyzed, and something differs from
 * what it was analyzed against. Everything fresh means asking again would change nothing,
 * so it is not offered.
 */
export function canReanalyze(response: ParlayAssessmentResponseData): boolean {
    return response.can_request
        && hasAnyAssessment(response)
        && allSlots(response).some(slot => slot.status !== SlotStatus.FRESH)
}
