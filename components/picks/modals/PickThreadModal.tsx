import React, { useEffect } from "react"
import {
    Keyboard, KeyboardAvoidingView, Platform, Pressable, Text, View,
} from "react-native"
import { PickReactionResponseData, PickResponseData } from "@/api"
import AppModal from "@/components/reusable/AppModal"
import IconAction from "@/components/reusable/IconAction"
import CommentThread from "@/components/comments/CommentThread"
import PickDisplay from "@/components/picks/PickDisplay"
import AddReactionButton from "@/components/picks/AddReactionButton"
import { myEmoji, sameReactions, usePickComments, usePickReactions } from "@/composables/usePickSocial"
import { Gambler, useGamblingSeasonContext } from "@/contexts/gamblingSeasonContext"
import { PickDisplayUtil } from "@/util/picks"
import { colors, shadows, spacing, typography } from "@/theme/colors"

type Props = {
    /** Null when nothing is open, which is also what stops the thread polling. */
    pick: PickResponseData | null
    gamblerName: string
    /** A closed parlay's argument still reads; it just stops taking anything new. */
    readOnly: boolean
    /** Nobody reacts to their own bet. Replies are unaffected — see GamblerParlaySlot. */
    isOwnPick?: boolean
    onClose: () => void
    /**
     * Writes back into the parlay list, which is where the pick actually lives. The chips
     * here and the chips on the card behind are the same array, so one patch moves both.
     */
    patchPick: (change: (pick: PickResponseData) => PickResponseData) => void
}

/** One gambler and everything they left, in the order the chips are grouped. */
type ReactorGroup = { gamblerId: number, name: string, emoji: string[] }

/**
 * Reactions turned inside out: by person rather than by emoji.
 *
 * The card already answers "what did this pick get" — a count per emoji. In here the
 * interesting question is the other one, "who said what", and a name with their reactions
 * beside it answers it in one line per person instead of making you cross-reference rows.
 *
 * Ordered by the season's own gambler order rather than by who reacted first, so a cell
 * never moves between renders as reactions stream in.
 */
function groupByReactor(
    reactions: PickReactionResponseData[], sortedGamblers: Gambler[],
): ReactorGroup[] {
    const held = new Map<number, string[]>()
    // The reactions arrive in palette order, so each person's emoji come out in it too.
    for (const reaction of reactions) {
        for (const id of reaction.gambler_ids) {
            const existing = held.get(id)
            if (existing) existing.push(reaction.emoji)
            else held.set(id, [reaction.emoji])
        }
    }
    return sortedGamblers
        .filter(gambler => held.has(gambler.id))
        .map(gambler => ({
            gamblerId: gambler.id,
            name: gambler.firstName,
            emoji: held.get(gambler.id)!,
        }))
}

/** The drawn circle. Big enough to read an emoji in, small enough for two cells a row. */
const STACK_SIZE = 24
/** How much of the one before each disc covers. */
const STACK_OVERLAP = 0.3
/** Past this the stack would crowd the name out of a half-width cell. */
const STACK_MAX = 5
/**
 * Optical correction, measured off the rendered control rather than derived.
 *
 * Flexbox centres the text box and textAlign centres the line within it, but neither can
 * reach the ink: an emoji's glyph does not sit centred in its own advance box, so it reads
 * left of centre however perfectly the boxes around it are aligned. Same class of problem
 * as ARROW_OPTICAL_LIFT in VoteControl, and corrected the same way — a transform, so the
 * mark moves without the disc under it moving.
 */
const STACK_EMOJI_NUDGE = 1

/**
 * Someone's reactions, shingled left to right.
 *
 * Each sits on an opaque disc rather than floating as bare text: overlapping glyphs on a
 * transparent ground read as a rendering fault, while a disc occluding the one before it
 * reads as a stack. Later siblings paint over earlier ones, which is the order wanted here,
 * so nothing needs a zIndex.
 */
function ReactionStack({ emoji }: { emoji: string[] }) {
    const shown = emoji.slice(0, STACK_MAX)
    const hidden = emoji.length - shown.length

    return (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
            {shown.map((e, index) => (
                <View
                    key={e}
                    style={{
                        width: STACK_SIZE, height: STACK_SIZE, borderRadius: STACK_SIZE / 2,
                        alignItems: "center", justifyContent: "center",
                        // A shade off the sheet, so the disc reads without carrying colour
                        // of its own. The rim is the sheet's own colour rather than a border
                        // colour, so where two discs overlap it reads as one cut out of the
                        // other — what makes a stack look stacked rather than crowded.
                        backgroundColor: colors.card,
                        borderWidth: 1.5, borderColor: colors.backgroundSecondary,
                        marginLeft: index === 0 ? 0 : -STACK_SIZE * STACK_OVERLAP,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 13,
                            // Stretched, then centred. Left to itself the Text hugs the
                            // glyph's advance box, so alignItems centres that box and
                            // textAlign has no room to do anything — and an emoji whose ink
                            // sits off-centre in its advance box stays off-centre. Filling
                            // the disc gives textAlign something to work with.
                            alignSelf: "stretch",
                            textAlign: "center",
                            transform: [{ translateX: STACK_EMOJI_NUDGE }],
                        }}
                    >
                        {e}
                    </Text>
                </View>
            ))}
            {hidden > 0 && (
                <Text style={{ ...typography.small, color: colors.textMuted, marginLeft: spacing.xs }}>
                    +{hidden}
                </Text>
            )}
        </View>
    )
}

/**
 * One pick in full: the bet, who has reacted to it and what they said about it.
 *
 * Holds no state of its own for either — the pick comes in as a prop and every change is
 * written back through patchPick, so the drawer and the card cannot disagree.
 */
export default function PickThreadModal(props: Props) {
    const { pick, readOnly, isOwnPick = false } = props
    const { gamblerId, sortedGamblers } = useGamblingSeasonContext()

    const reactions = usePickReactions(props.patchPick)
    const comments = usePickComments(pick?.id ?? null, {
        // Whole rather than incremental, and dropped when it says nothing new — applying an
        // identical array every few seconds would re-render the drawer and the card forever.
        onReactions: incoming => props.patchPick(current =>
            sameReactions(current.reactions, incoming) ? current : { ...current, reactions: incoming }
        ),
        // A tick landing mid-toggle answers with the state from before it, and the chip
        // flickers off and back on.
        pausePolling: reactions.saving,
    })

    // Keeps the card's reply count honest as replies stream in behind the open drawer.
    // Gated on the replies having arrived for *this* pick: the empty array they start as
    // would otherwise blank a good count.
    useEffect(() => {
        if (pick && comments.loadedId === pick.id) {
            const count = comments.comments.length
            props.patchPick(current => current.comment_count === count
                ? current
                : { ...current, comment_count: count })
        }
    }, [comments.comments.length, comments.loadedId]) // eslint-disable-line react-hooks/exhaustive-deps

    if (!pick) return null

    return (
        <AppModal visible animationType="slide" transparent onRequestClose={props.onClose}>
            <KeyboardAvoidingView
                // The sheet sits on the bottom edge with the reply box at its foot, so
                // without this the keyboard covers the field the moment it is tapped.
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
            <View style={{ flex: 1, backgroundColor: colors.overlay }}>
                {/* Only the dim strip above the sheet dismisses the keyboard — a touchable
                    ancestor would take the pan before the replies' scroll view could.
                    Nothing here closes the modal: losing a half-written reply to a stray
                    tap is worse than a stuck keyboard. */}
                <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss} accessible={false} />

                <View style={{
                    maxHeight: "88%",
                    backgroundColor: colors.backgroundSecondary,
                    borderTopLeftRadius: 20, borderTopRightRadius: 20,
                    borderWidth: 1, borderColor: colors.cardBorder,
                    padding: spacing.xl,
                    ...shadows.modal,
                }}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: spacing.md }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ ...typography.heading, color: colors.textPrimary }}>
                                {PickDisplayUtil.playerTeamDisplay(pick)}
                            </Text>
                            <PickDisplay pick={pick} showTarget={false} />
                            <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                                {props.gamblerName}
                            </Text>
                        </View>
                        <IconAction
                            icon="close" label="Close" color={colors.textSecondary}
                            onPress={props.onClose}
                        />
                    </View>

                    <View style={{ marginTop: spacing.lg }}>
                        {/* Two to a row. Half width rather than a gap-driven basis so the
                            columns line up whatever the stacks in them are doing. */}
                        <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: spacing.sm }}>
                            {groupByReactor(pick.reactions, sortedGamblers).map(group => (
                                <View
                                    key={group.gamblerId}
                                    style={{
                                        width: "50%",
                                        flexDirection: "row", alignItems: "center", gap: spacing.sm,
                                        paddingRight: spacing.sm,
                                    }}
                                >
                                    <ReactionStack emoji={group.emoji} />
                                    <Text
                                        numberOfLines={1}
                                        style={{ ...typography.caption, color: colors.textSecondary, flexShrink: 1 }}
                                    >
                                        {group.name}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* The only way in or out now that the rows above are a readout
                            rather than controls — the palette rings what you already hold,
                            and tapping one of those takes it back. */}
                        {!readOnly && !isOwnPick && (
                            <View style={{
                                marginTop: pick.reactions.length > 0 ? spacing.md : 0,
                                alignSelf: "flex-start",
                            }}>
                                <AddReactionButton
                                    iconSize={18}
                                    mine={myEmoji(pick.reactions, gamblerId)}
                                    onPick={emoji => reactions.toggle(pick.id, emoji)}
                                />
                            </View>
                        )}
                    </View>

                    {/* From the card's own count, which the effect above keeps in step — the
                        loaded replies would read "0 replies" until the fetch lands. Dropped
                        at zero: the reply box below is invitation enough. */}
                    {pick.comment_count > 0 && (
                        <Text style={{
                            ...typography.caption, color: colors.textSecondary,
                            textTransform: "uppercase", letterSpacing: 0.5,
                            marginTop: spacing.lg,
                        }}>
                            {pick.comment_count === 1 ? "1 reply" : `${pick.comment_count} replies`}
                        </Text>
                    )}

                    <CommentThread
                        thread={comments}
                        targetId={pick.id}
                        readOnly={readOnly}
                        placeholder="Say something about this pick"
                    />
                </View>
            </View>
            </KeyboardAvoidingView>
        </AppModal>
    )
}
