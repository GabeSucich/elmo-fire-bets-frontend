import React, { useEffect, useState } from "react"
import {
    ActivityIndicator, FlatList, Keyboard, LayoutAnimation, Pressable, Text, TextInput,
    View,
} from "react-native"
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import { LineResponseData, PlayerLinesResponseData, PropBetDirection, PropBetType, SlateType } from "@/api"
import AppModal from "@/components/reusable/AppModal"
import IconAction from "@/components/reusable/IconAction"
import TeamLogo from "@/components/reusable/TeamLogo"
import Notice from "@/components/reusable/Notice"
import TabButtons from "@/components/reusable/TabButtons"
import ActivityLoader from "@/components/reusable/ActivityLoader"
import {
    kickoffLabel, matchesPlayer, matchesProp, slateWindowOf, SLATE_WINDOWS, SlateWindow,
    useSlateLines, windowForSlateType,
} from "@/composables/useSlateLines"
import SlateWindowFilter from "@/components/picks/SlateWindowFilter"
import { PickPrefill } from "@/components/picks/PickEditor"
import { PlayerTeamResult, playerTeamDisplay, searchPlayersWithFallback } from "@/util/executePlayerSearch"
import { namesMatch } from "@/util/nameMatch"
import { slateDateLabel } from "@/util/slateDate"
import { parseAmericanOdds } from "@/util/picks"
import { colors, shadows, spacing, typography } from "@/theme/colors"

// Game first, and the one it opens on: a lay is built around a fixture, so "who is playing
// tonight" is the question people arrive with. The other two are ways of cutting across the
// slate once you already know that.
const MODES = ["By game", "By player", "By prop"] as const
type Mode = typeof MODES[number]

type Props = {
    visible: boolean
    /** The parlay's competition date — the slate whose lines are on offer. */
    date: string
    /** Used to start the time filter where the lay already says it belongs. */
    slateType: SlateType
    onClose: () => void
    /** Hands back a fully resolved starting point for the pick editor. */
    onSelect: (prefill: PickPrefill) => void
    /**
     * Fired once this sheet has actually finished dismissing.
     *
     * iOS will not present a modal while another is still going away — it does it silently,
     * with no error and nothing on screen — so anything that opens in response to a
     * selection has to wait for this rather than firing alongside onSelect.
     */
    onDismissed?: () => void
    /**
     * Leaves the board for the editor. Optional: a caller that has no editor to offer
     * simply does not get the button.
     */
    onEnterManually?: () => void
}

/**
 * One line of the list, whatever the list happens to be showing.
 *
 * Every mode is flattened to this so a single virtualized list can serve all of them. That
 * is the point: a Sunday prices 405 players and 372 of them have a touchdown market, and
 * rendering that many rows in one go is what made switching tabs stall for a beat. A
 * FlatList builds a screenful and then keeps up as you scroll.
 */
type Row =
    | { kind: "section"; window: SlateWindow; first: boolean }
    | { kind: "game"; game: GameEntry; last: boolean }
    | { kind: "prop"; prop: PropBetType; count: number }
    | { kind: "propLine"; player: PlayerLinesResponseData; line: LineResponseData }
    | { kind: "player"; player: PlayerLinesResponseData }

/** One fixture on the slate, with how many of its players are priced. */
type GameEntry = {
    matchup: string
    startsAt: string | null
    window: SlateWindow | null
    count: number
}

/** What we are asking the player-resolution step to confirm, if anything. */
type Pending = {
    player: PlayerLinesResponseData
    propType: PropBetType
    line: number
    direction: PropBetDirection
    /** The tapped side's price, carried so confirming a player prices the pick as well. */
    odds: string | null
    /** Candidates from ESPN. One exact match resolves silently; anything else asks. */
    candidates: PlayerTeamResult[]
}

function odds(value: string | null | undefined) {
    return value ?? "—"
}


/** "SF @ LA · 1:05 PM PT" — which game, and when, on one muted line. */
function subtitle(player: PlayerLinesResponseData): string {
    return [player.matchup, kickoffLabel(player.starts_at)].filter(Boolean).join("  ·  ")
}

/**
 * The parts of the day, set apart more firmly than the games inside them.
 *
 * The section heading was the same weight as the rows it introduced, so a slate read as one
 * long list with occasional grey words in it rather than as morning, afternoon and evening.
 */
const SECTION_TITLE_SIZE = 13
/** Rows built before the first paint — comfortably more than a phone shows at once. */
const INITIAL_ROWS = 14
const SECTION_RULE_WIDTH = 2

/**
 * What a TD lay is actually about: reaching the end zone.
 *
 * Named explicitly rather than matched on the substring "TD", which also caught Passing
 * TDs — a quarterback's count of throws that ended in a score, which is somebody else
 * doing the scoring and a different bet entirely. Longest TD is out for the same reason:
 * it is a yardage market wearing the letters.
 *
 * The cost of a list is that a scoring prop added later has to be added here too. That is
 * the right trade: the substring was wrong about a market the books actually publish, and
 * being quietly wrong beats being briefly incomplete only if nobody notices.
 */
const SCORING_TD_PROPS: ReadonlySet<PropBetType> = new Set([
    PropBetType.TDS, PropBetType.RUSH_TDS, PropBetType.REC_TDS,
])

/**
 * Orders a TD board by how likely the player is to score.
 *
 * Keyed on the anytime market rather than on whichever TD line comes first, so a player
 * priced for rushing and receiving scores is still ranked by the bet people actually make.
 * A player the book has not priced sinks to the bottom rather than sorting as free money,
 * and ties fall back to the name so the order is stable between refreshes.
 */
function compareByTdPrice(a: PlayerLinesResponseData, b: PlayerLinesResponseData): number {
    const priceOf = (p: PlayerLinesResponseData) =>
        parseAmericanOdds(p.lines.find(l => l.prop_type === PropBetType.TDS)?.over_odds)
    const left = priceOf(a)
    const right = priceOf(b)
    if (left === null && right === null) return a.name.localeCompare(b.name)
    if (left === null) return 1
    if (right === null) return -1
    return left - right || a.name.localeCompare(b.name)
}

/** A shade smaller than a player's, since a fixture row carries two of them. */
const GAME_LOGO_SIZE = 20

/**
 * "NO @ DET" as its two sides.
 *
 * The server builds this string, always in this form, so splitting it back is safe — and
 * cheaper than widening the response to carry two fields the client only wants for an icon.
 * Anything that does not split returns empty, which renders no logos rather than a wrong one.
 */
function splitMatchup(matchup: string): string[] {
    const sides = matchup.split(" @ ")
    return sides.length === 2 ? sides : []
}

/**
 * "NO @ DET" with each side wearing its own mark.
 *
 * Paired rather than banked together at the front of the row: two logos side by side, then
 * the names, makes you match the first to the first and the second to the second. Beside
 * its own abbreviation, each mark reads as one thing.
 *
 * Falls back to the plain string if it does not split, which is the safe way to be wrong —
 * a fixture is still legible without its logos.
 */
function MatchupLine({ matchup }: { matchup: string }) {
    const nameStyle = { ...typography.body, color: colors.textPrimary, fontWeight: "600" as const }
    const sides = splitMatchup(matchup)
    if (sides.length !== 2) return <Text style={nameStyle}>{matchup}</Text>

    return (
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.xs }}>
            <TeamLogo team={sides[0]} size={GAME_LOGO_SIZE} />
            <Text style={nameStyle}>{sides[0]}</Text>
            {/* Given room on both sides so it reads as a separator rather than a third
                name, but kept in the primary colour — muted, it fell away between two logos
                and the two sides ran together. */}
            <Text style={{ ...typography.small, color: colors.textPrimary, marginHorizontal: spacing.xs }}>
                @
            </Text>
            <TeamLogo team={sides[1]} size={GAME_LOGO_SIZE} />
            <Text style={nameStyle}>{sides[1]}</Text>
        </View>
    )
}

/** Most markets first, so the players a book has an opinion about lead the board. */
function compareByBetCount(a: PlayerLinesResponseData, b: PlayerLinesResponseData): number {
    return b.lines.length - a.lines.length || a.name.localeCompare(b.name)
}

/** Wide enough that the odds and the spinner occupy the same footprint. */
const SIDE_MIN_WIDTH = 62

/** Identifies one side of one line, so a spinner can be shown on the button you pressed. */
function sideKey(
    playerName: string, propType: PropBetType, line: number, dir: PropBetDirection,
): string {
    // Keyed on the name, which is what the rows themselves are keyed on — the response
    // carries no id, and a slate prices each player once.
    return `${playerName}:${propType}:${line}:${dir}`
}

/**
 * The two sides of one line, as separate taps.
 *
 * Direction is half the bet, so choosing the number without it would leave the editor
 * guessing at the part that decides whether it wins. Shared by both search modes so the
 * two lists behave identically.
 */
function Sides({ player, line, resolvingKey, onChoose }: {
    player: PlayerLinesResponseData
    line: LineResponseData
    /** Which side is currently being matched, if any — see sideKey. */
    resolvingKey: string | null
    onChoose: (
        p: PlayerLinesResponseData, t: PropBetType, n: number, d: PropBetDirection,
        odds: string | null,
    ) => void
}) {
    return (
        <>
            {[PropBetDirection.OVER, PropBetDirection.UNDER].map(dir => {
                const over = dir === PropBetDirection.OVER
                const tint = over ? colors.success : colors.danger
                const price = over ? line.over_odds : line.under_odds
                const busy = resolvingKey === sideKey(player.name, line.prop_type, line.line, dir)
                // Every side locks while one is resolving. Two matches in flight would race
                // to open the editor, and the loser would quietly overwrite the pick you
                // meant to make.
                const locked = resolvingKey !== null && !busy
                return (
                    <Pressable
                        key={dir}
                        onPress={() => onChoose(player, line.prop_type, line.line, dir, price)}
                        disabled={resolvingKey !== null}
                        hitSlop={6}
                        // A function, so the button fills under your finger. Plain Pressable
                        // has no default feedback of any kind, which left the tap looking
                        // like it had missed — and a bet button that gives nothing back
                        // invites a second tap on a different line.
                        style={({ pressed }) => ({
                            paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
                            borderRadius: 8, borderWidth: 1,
                            borderColor: tint,
                            // Hex with an alpha pair; the theme's colours are all 6-digit.
                            backgroundColor: pressed || busy ? `${tint}33` : "transparent",
                            opacity: locked ? 0.4 : 1,
                            // Holds its width when the odds are swapped for the spinner, so
                            // the row does not reflow under your finger mid-tap.
                            minWidth: SIDE_MIN_WIDTH,
                            alignItems: "center", justifyContent: "center",
                        })}
                    >
                        {busy
                            ? <ActivityIndicator size="small" color={tint} />
                            : (
                                <Text style={{
                                    ...typography.small,
                                    color: tint,
                                    fontWeight: "600",
                                }}>
                                    {over ? "▲" : "▼"} {odds(price)}
                                </Text>
                            )}
                    </Pressable>
                )
            })}
        </>
    )
}


/**
 * One player, expanding to their lines.
 *
 * Shared by the player and game views — they differ in how you arrive at a player, not in
 * what a player looks like, and two copies would have drifted the moment either changed.
 */
function PlayerRow({ player, open, resolvingKey, onToggle, onChoose }: {
    player: PlayerLinesResponseData
    open: boolean
    resolvingKey: string | null
    onToggle: () => void
    onChoose: (
        p: PlayerLinesResponseData, t: PropBetType, n: number, d: PropBetDirection,
        odds: string | null,
    ) => void
}) {
    return (
        <View style={{ borderBottomWidth: 1, borderBottomColor: colors.divider }}>
            <Pressable
                onPress={onToggle}
                style={{
                    flexDirection: "row", alignItems: "center",
                    paddingVertical: spacing.md, gap: spacing.sm,
                }}
            >
                {/* Leading rather than trailing the name: a logo in a fixed column lines
                    up down the list, where one chasing the end of each name does not. */}
                <TeamLogo team={player.team} />
                <View style={{ flex: 1 }}>
                    <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: "600" }}>
                        {player.name}
                    </Text>
                    {subtitle(player) ? (
                        <Text style={{ ...typography.small, color: colors.textMuted }}>
                            {subtitle(player)}
                        </Text>
                    ) : null}
                </View>
                <Text style={{ ...typography.small, color: colors.textMuted }}>
                    {player.lines.length}
                </Text>
                <MaterialCommunityIcons
                    name={open ? "chevron-up" : "chevron-down"}
                    size={18} color={colors.textSecondary}
                />
            </Pressable>

            {/* Rendered outright, with the animation left to LayoutAnimation on the toggle.
                Collapsible measures its content and animates to that number under
                overflow:hidden, and a measurement that comes in short clips the last row —
                which is exactly what it did here. Animating the layout change instead has
                nothing to measure and so nothing to get wrong. */}
            {open && player.lines.map(l => (
                <View
                    // Keyed on the number as well as the prop: a player can hold both an
                    // anytime touchdown at 0.5 and an alternate at 1.5, and they are
                    // different bets.
                    key={`${l.prop_type}-${l.line}`}
                    style={{
                        flexDirection: "row", alignItems: "center",
                        gap: spacing.sm, paddingBottom: spacing.md, paddingLeft: spacing.md,
                    }}
                >
                    <Text style={{ ...typography.caption, color: colors.textSecondary, flex: 1 }}>
                        {l.prop_type}
                    </Text>
                    <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: "700" }}>
                        {l.line}
                    </Text>
                    {/* Over and under are separate taps because the direction is half the
                        bet — picking the number alone would leave the editor guessing at
                        the part that decides it. */}
                    <Sides player={player} line={l} resolvingKey={resolvingKey} onChoose={onChoose} />
                </View>
            ))}
        </View>
    )
}

/**
 * Browsing a sportsbook's lines for one slate, to start a pick from one.
 *
 * Everything here is read from a cached slate, so searching and filtering cost nothing —
 * the only network call is resolving the one player you actually choose, which is why that
 * happens on selection rather than for all several hundred up front.
 */
export default function SlateLinesModal({
    visible, date, slateType, onClose, onSelect, onDismissed, onEnterManually,
}: Props) {
    const { players, loading, loaded } = useSlateLines(visible ? date : null)
    const [search, setSearch] = useState("")
    // Three ways in, for three questions people actually arrive with: "what is on tonight",
    // "what is Purdy priced at", and "who has a receptions line".
    const [mode, setMode] = useState<Mode>("By game")
    // By prop is two steps — narrow to a prop, then read the field. Null means step one.
    const [selectedProp, setSelectedProp] = useState<PropBetType | null>(null)
    // By game is two steps as well: choose a fixture, then read its board.
    const [selectedGame, setSelectedGame] = useState<string | null>(null)
    // Seeded from the lay's own slate type — a Thursday night lay opens on Evening rather
    // than on the whole day. Only a starting point: it is cleared and changed like any
    // other filter, and a slate that spans windows starts unfiltered.
    const [window, setWindow] = useState<SlateWindow | null>(() => windowForSlateType(slateType))

    // Re-seeded each time it opens, so a filter cleared last time does not persist into a
    // different lay, and reopening the same one is predictable.
    useEffect(() => {
        if (!visible) return
        setWindow(windowForSlateType(slateType))
        setSearch("")
        setMode("By game")
        setSelectedProp(null)
        setSelectedGame(null)
    }, [visible, slateType])
    const [expanded, setExpanded] = useState<string | null>(null)
    const [pending, setPending] = useState<Pending | null>(null)
    // The side being matched, not merely that one is: the spinner belongs on the
    // button that was pressed, where you are already looking.
    const [resolvingKey, setResolvingKey] = useState<string | null>(null)

    // Applied before either search sees the slate, so the filter means the same thing in
    // both modes and neither has to know about it.
    // Counted in games, not players. "Morning 232" is the number of priced athletes, which
    // is not a quantity anyone thinks in — "Morning 8" is how many games kick off then.
    const windowGames = players.reduce<Map<SlateWindow, Set<string>>>((acc, p) => {
        const w = slateWindowOf(p.starts_at)
        if (!w || !p.matchup) return acc
        const seen = acc.get(w) ?? new Set<string>()
        seen.add(p.matchup)
        return acc.set(w, seen)
    }, new Map())
    const windowCounts = new Map([...windowGames].map(([w, games]) => [w, games.size]))
    const totalGames = new Set(players.map(p => p.matchup).filter(Boolean)).size
    const inWindow = window === null ? players : players.filter(p => slateWindowOf(p.starts_at) === window)

    // A TD lay is only ever about touchdowns, so everything else is noise on it.
    const tdOnly = slateType === SlateType.TD
    const available = tdOnly
        ? inWindow
            .map(p => ({ ...p, lines: p.lines.filter(l => SCORING_TD_PROPS.has(l.prop_type)) }))
            .filter(p => p.lines.length > 0)
            // Shortest price first, which on a TD board is likeliest scorer first. American
            // odds never fall between -100 and +100, so they order numerically without any
            // conversion: -260 is a back who will get goal-line carries, +1300 is a third
            // receiver. Alphabetical is the right default when every row is a different
            // question, but here every row is the same question and the price is the answer.
            .sort(compareByTdPrice)
        // Busiest board first everywhere else. How many markets a book opens on a player is
        // its own judgement about who matters: a starting back carries a dozen, a third
        // tight end carries one. Alphabetical put A.J. Dillon above Josh Allen, which is an
        // order nobody was ever looking for. Copied before sorting — when no time filter is
        // on, this list is the fetched one and sorting in place would reorder it underneath.
        : [...inWindow].sort(compareByBetCount)

    // The whole slate is shown until it is narrowed. Search filters it rather than
    // revealing it, so the sheet always says what is on offer.
    const searching = search.trim().length > 0
    // By game does not consult the search term at all — it has no box to type into, and a
    // filter with no visible control is worse than none: text left over from another tab
    // would quietly hide half a fixture's board with nothing on screen to explain it.
    const shown = mode === "By player" ? available.filter(p => matchesPlayer(p, search))
        : mode === "By game" && selectedGame !== null
            ? available.filter(p => p.matchup === selectedGame)
            : []

    // One entry per fixture, in kickoff order, grouped under the window it belongs to.
    // Built from the players because that is the only place a game appears — a fixture
    // nobody is priced in has nothing to offer and is rightly absent.
    const games = [...available.reduce((acc, p) => {
        if (!p.matchup) return acc
        const existing = acc.get(p.matchup)
        if (existing) existing.count += 1
        else acc.set(p.matchup, {
            matchup: p.matchup,
            startsAt: p.starts_at ?? null,
            window: slateWindowOf(p.starts_at),
            count: 1,
        })
        return acc
    }, new Map<string, { matchup: string, startsAt: string | null, window: SlateWindow | null, count: number }>()).values()]
        .sort((a, b) => (a.startsAt ?? "").localeCompare(b.startsAt ?? ""))

    // Which props this slate actually prices, with how many players each covers — a count
    // is what tells you whether a prop is worth opening before you open it.
    const propCounts = available.reduce<Map<PropBetType, number>>((acc, p) => {
        for (const l of p.lines) acc.set(l.prop_type, (acc.get(l.prop_type) ?? 0) + 1)
        return acc
    }, new Map())
    const propMatches = mode === "By prop" && selectedProp === null
        ? [...propCounts.entries()]
            .filter(([prop]) => matchesProp(prop, search))
            .sort(([a], [b]) => a.localeCompare(b))
        : []

    // Once a prop is chosen the grouping inverts: one prop, everyone priced for it,
    // highest line first so the field reads as a range rather than an alphabet.
    const propField = selectedProp === null ? [] : available
        .flatMap(p => p.lines.filter(l => l.prop_type === selectedProp).map(l => ({ player: p, line: l })))
        .sort((a, b) => b.line.line - a.line.line)

    /**
     * Turn a chosen line into a pick.
     *
     * The book and ESPN are separate universes with no shared identifier, so the only
     * bridge is the name. An exact match on both name and team is taken as certain;
     * anything else is put in front of the reader rather than guessed at, because the
     * failure mode is silently attributing a bet to the wrong player.
     */
    async function choose(
        player: PlayerLinesResponseData, propType: PropBetType, line: number,
        direction: PropBetDirection, odds: string | null,
    ) {
        Keyboard.dismiss()
        setResolvingKey(sideKey(player.name, propType, line, direction))
        try {
            const candidates = await searchPlayersWithFallback(player.name)
            // Compared on what both sources agree about rather than character for
            // character: a suffix or a full stop one of them carries and the other does
            // not was sending thirty-nine names on a slate to this dialog with the right
            // answer already sitting in the list.
            const byName = candidates.filter(c => c.playerName && namesMatch(c.playerName, player.name))

            // The name decides it. Team is only consulted to break a tie between players who
            // share one, never to confirm a lone match: the two sources do not agree on
            // abbreviations — the book calls the Rams "LA" where ESPN calls them "LAR" — so
            // demanding both agree sent unambiguous players to a dialog whose only option
            // was the answer we already had.
            const resolved = byName.length === 1
                ? byName
                : byName.filter(c => player.team && c.teamName === player.team)

            if (resolved.length === 1) {
                onSelect({ target: resolved[0], propType, line, direction, odds })
                return
            }
            setPending({ player, propType, line, direction, odds, candidates })
        } catch {
            setPending({ player, propType, line, direction, odds, candidates: [] })
        } finally {
            setResolvingKey(null)
        }
    }

    /**
     * What the list is showing, or the reason it is showing nothing.
     *
     * Returns rows rather than elements so they can be virtualized — see Row. A notice is
     * not a list and comes back as one, which the caller renders on its own.
     */
    function content(): { loading: true } | { notice: string } | { rows: Row[] } {
        if (loading && !loaded) return { loading: true }
        if (loaded && players.length === 0) {
            return { notice:
                "No lines for this date. Sportsbooks price a slate a few days out, and " +
                "not at all once it has been played — enter the pick by hand instead."
            }
        }
        if (window !== null && available.length === 0) {
            return { notice: `No ${window.toLowerCase()} games on this slate.` }
        }

        if (mode === "By prop") {
            if (selectedProp === null) {
                if (propMatches.length === 0) {
                    return { notice:
                        searching ? `No prop matching "${search}" on this slate.` : "No props on this slate."
                    }
                }
                return { rows: propMatches.map(([prop, count]) => ({ kind: "prop", prop, count })) }
            }
            return { rows: propField.map(({ player, line }) => ({ kind: "propLine", player, line })) }
        }

        if (mode === "By game" && selectedGame === null) {
            if (games.length === 0) return { notice: "No games priced on this slate." }
            // Sections in window order, so the board reads down the day rather than in
            // whatever order the provider happened to return fixtures.
            const windows = SLATE_WINDOWS.filter(w => games.some(g => g.window === w))
            return { rows: windows.flatMap((w, windowIndex) => {
                const inWindow = games.filter(g => g.window === w)
                return [
                    { kind: "section" as const, window: w, first: windowIndex === 0 },
                    ...inWindow.map((game, i) => ({
                        kind: "game" as const, game, last: i === inWindow.length - 1,
                    })),
                ]
            }) }
        }

        if (shown.length === 0) {
            return { notice:
                searching
                    ? `Nobody matching "${search}" is priced on this slate.`
                    : "Nobody is priced on this slate."
            }
        }

        return { rows: shown.map(player => ({ kind: "player", player })) }
    }

    /** Stable across re-renders, so a row keeps its identity as the list is recycled. */
    function rowKey(row: Row): string {
        switch (row.kind) {
            case "section": return `section:${row.window}`
            case "game": return `game:${row.game.matchup}`
            case "prop": return `prop:${row.prop}`
            case "propLine": return `line:${row.player.name}:${row.line.prop_type}:${row.line.line}`
            case "player": return `player:${row.player.name}`
        }
    }

    function renderRow(row: Row) {
        switch (row.kind) {
            case "section":
                return (
                    <>
                        {/* A heavier rule than the one between fixtures, and only between
                            sections — the first needs none, sitting directly under the tabs.
                            Two weights of line doing two jobs: the thin one separates games
                            within a part of the day, this one separates the parts. */}
                        <View style={{
                            borderTopWidth: row.first ? 0 : SECTION_RULE_WIDTH,
                            borderTopColor: colors.textMuted,
                            marginTop: row.first ? spacing.sm : spacing.xl,
                        }} />
                        <Text style={{
                            ...typography.caption, fontSize: SECTION_TITLE_SIZE, fontWeight: "700",
                            color: colors.textSecondary,
                            textTransform: "uppercase", letterSpacing: 1.2,
                            marginTop: spacing.md, marginBottom: spacing.sm,
                        }}>
                            {row.window}
                        </Text>
                    </>
                )

            case "game":
                return (
                    <Pressable
                        onPress={() => { Keyboard.dismiss(); setSelectedGame(row.game.matchup) }}
                        style={{
                            flexDirection: "row", alignItems: "center", gap: spacing.sm,
                            paddingVertical: spacing.md,
                            // Dropped on the last of a section, so its thin line does not
                            // sit just above the section rule as a stray double.
                            borderBottomWidth: row.last ? 0 : 1,
                            borderBottomColor: colors.divider,
                        }}
                    >
                        <View style={{ flex: 1 }}>
                            <MatchupLine matchup={row.game.matchup} />
                            {kickoffLabel(row.game.startsAt) ? (
                                <Text style={{ ...typography.small, color: colors.textMuted }}>
                                    {kickoffLabel(row.game.startsAt)}
                                </Text>
                            ) : null}
                        </View>
                        <Text style={{ ...typography.small, color: colors.textMuted }}>
                            {row.game.count} {row.game.count === 1 ? "player" : "players"}
                        </Text>
                        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
                    </Pressable>
                )

            case "prop":
                return (
                    <Pressable
                        onPress={() => { Keyboard.dismiss(); setSelectedProp(row.prop) }}
                        style={{
                            flexDirection: "row", alignItems: "center", gap: spacing.sm,
                            paddingVertical: spacing.md,
                            borderBottomWidth: 1, borderBottomColor: colors.divider,
                        }}
                    >
                        <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: "600", flex: 1 }}>
                            {row.prop}
                        </Text>
                        <Text style={{ ...typography.small, color: colors.textMuted }}>
                            {row.count} {row.count === 1 ? "player" : "players"}
                        </Text>
                        <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textSecondary} />
                    </Pressable>
                )

            case "propLine":
                return (
                    <View style={{
                        flexDirection: "row", alignItems: "center", gap: spacing.sm,
                        paddingVertical: spacing.md,
                        borderBottomWidth: 1, borderBottomColor: colors.divider,
                    }}>
                        <TeamLogo team={row.player.team} />
                        <View style={{ flex: 1 }}>
                            <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: "600" }}>
                                {row.player.name}
                            </Text>
                            <Text style={{ ...typography.small, color: colors.textMuted }}>
                                {row.line.prop_type}{subtitle(row.player) ? `  ·  ${subtitle(row.player)}` : ""}
                            </Text>
                        </View>
                        <Text style={{ ...typography.body, color: colors.textPrimary, fontWeight: "700" }}>
                            {row.line.line}
                        </Text>
                        <Sides player={row.player} line={row.line} resolvingKey={resolvingKey} onChoose={choose} />
                    </View>
                )

            case "player":
                return (
                    <PlayerRow
                        player={row.player}
                        open={expanded === row.player.name}
                        resolvingKey={resolvingKey}
                        onToggle={() => {
                            // Animates whatever the next layout turns out to be, rather than
                            // animating to a height worked out in advance.
                            LayoutAnimation.configureNext(
                                LayoutAnimation.create(160, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity)
                            )
                            setExpanded(expanded === row.player.name ? null : row.player.name)
                        }}
                        onChoose={choose}
                    />
                )
        }
    }

    return (
        <AppModal visible={visible} animationType="slide" transparent onRequestClose={onClose} onDismiss={onDismissed}>
            <View style={{ flex: 1, backgroundColor: colors.overlay }}>
                <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss} accessible={false} />

                <View style={{
                    // Fixed rather than a maximum: a sheet that shrinks to its contents
                    // jumps between full height and a stub as you type, and the search box
                    // moves under your finger while you are using it.
                    height: "88%",
                    backgroundColor: colors.backgroundSecondary,
                    borderTopLeftRadius: 20, borderTopRightRadius: 20,
                    borderWidth: 1, borderColor: colors.cardBorder,
                    padding: spacing.xl,
                    ...shadows.modal,
                }}>
                    {/* The time filter belongs up here with the title, not among the
                        tabs: it narrows what every tab is looking at, where the tabs only
                        choose how to look. Beside them it read as a fourth tab. */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                        <View style={{ flexShrink: 1 }}>
                            <Text style={{ ...typography.heading, color: colors.textPrimary }}>
                                Browse Lines
                            </Text>
                            {/* The day, and only the day. The weekday is spelled out
                                because that is what makes a wrong date obvious at a glance
                                — a lay dated Monday and one dated Sunday are entirely
                                different boards, since Monday holds a single game. */}
                            <Text style={{ ...typography.small, color: colors.textMuted }}>
                                {slateDateLabel(date)}
                            </Text>
                        </View>
                        {/* Pushed to the far edge, next to the close: the title says what
                            the sheet is, and the controls that act on it gather on the other
                            side rather than crowding the heading. */}
                        <View style={{ flex: 1 }} />
                        <SlateWindowFilter
                            value={window}
                            counts={windowCounts}
                            total={totalGames}
                            onChange={setWindow}
                        />
                        <IconAction icon="close" label="Close" color={colors.textSecondary} onPress={onClose} />
                    </View>

                    {/* Switching modes clears the results but keeps what was typed —
                        "rec" is a plausible search in either, and retyping it to check the
                        other view would be busywork. */}
                    <View style={{ marginTop: spacing.md }}>
                        <TabButtons<Mode>
                            // By prop is dropped on a TD lay: with one prop on offer it
                            // would be a list of length one leading to the board you were
                            // already looking at.
                            tabs={(tdOnly ? MODES.filter(m => m !== "By prop") : MODES) as unknown as Mode[]}
                            activeTab={mode}
                            setActiveTab={next => { setSelectedProp(null); setSelectedGame(null); setMode(next) }}
                            getKey={m => m}
                            getDisplay={m => m}
                            size="sm"
                        />
                    </View>

                    {selectedGame !== null ? (
                        <Pressable
                            onPress={() => setSelectedGame(null)}
                            style={{
                                marginTop: spacing.sm,
                                flexDirection: "row", alignItems: "center", gap: spacing.sm,
                                borderWidth: 1, borderColor: colors.accent, borderRadius: 12,
                                paddingHorizontal: spacing.md, paddingVertical: spacing.md,
                            }}
                        >
                            <Text style={{ ...typography.body, color: colors.accent, fontWeight: "600", flex: 1 }}>
                                {selectedGame}
                            </Text>
                            <Text style={{ ...typography.small, color: colors.textMuted }}>
                                {shown.length} priced
                            </Text>
                            <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
                        </Pressable>
                    ) : selectedProp !== null ? (
                        /* Replaces the search box rather than sitting above it: with a prop
                           chosen there is nothing left to type, and leaving an empty field
                           there invites typing that would do nothing. */
                        <Pressable
                            onPress={() => setSelectedProp(null)}
                            style={{
                                marginTop: spacing.sm,
                                flexDirection: "row", alignItems: "center", gap: spacing.sm,
                                borderWidth: 1, borderColor: colors.accent, borderRadius: 12,
                                paddingHorizontal: spacing.md, paddingVertical: spacing.md,
                            }}
                        >
                            <Text style={{ ...typography.body, color: colors.accent, fontWeight: "600", flex: 1 }}>
                                {selectedProp}
                            </Text>
                            <Text style={{ ...typography.small, color: colors.textMuted }}>
                                {propField.length} priced
                            </Text>
                            <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
                        </Pressable>
                    ) : mode === "By game" ? (
                        /* No box at all here. A fixture list is short and already grouped by
                           kickoff, so there is nothing to narrow — and the field only ever
                           offered to search players, which is a different tab's question. */
                        null
                    ) : (
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder={mode === "By prop" ? "Search a prop" : "Search a player"}
                        placeholderTextColor={colors.textMuted}
                        // See PickEditor: autocorrect rewrites surnames as you type them.
                        autoCorrect={false}
                        spellCheck={false}
                        style={{
                            marginTop: spacing.sm,
                            borderWidth: 1, borderColor: colors.inputBorder, borderRadius: 12,
                            paddingHorizontal: spacing.md, paddingVertical: spacing.md,
                            color: colors.textPrimary, backgroundColor: colors.inputBackground,
                            fontSize: 16,
                        }}
                    />
                    )}

                    {/* Deliberately not animated. Drilling into a prop or a game replaces
                        the whole list, and a Sunday slate is several hundred rows — sliding
                        that in means animating every one of them, which is slow however
                        short the duration is set. The chip above already says where you are. */}
                    {(() => {
                        const shape = content()
                        if ("loading" in shape) {
                            return (
                                <View style={{ flex: 1, marginTop: spacing.sm }}>
                                    <ActivityLoader text="Loading lines..." />
                                </View>
                            )
                        }
                        if ("notice" in shape) {
                            return (
                                <View style={{ flex: 1, marginTop: spacing.sm }}>
                                    <Notice message={shape.notice} />
                                </View>
                            )
                        }
                        return (
                            <FlatList
                                style={{ flex: 1, marginTop: spacing.sm }}
                                data={shape.rows}
                                keyExtractor={rowKey}
                                renderItem={({ item }) => renderRow(item)}
                                keyboardShouldPersistTaps="always"
                                contentContainerStyle={{ paddingBottom: spacing.lg }}
                                // A screenful, then more as you scroll. The whole point of
                                // the change: switching to By player used to build all 405
                                // rows before the tab could repaint.
                                initialNumToRender={INITIAL_ROWS}
                                maxToRenderPerBatch={INITIAL_ROWS}
                                windowSize={7}
                                // Left off deliberately. Rows here change height when they
                                // expand, and clipping them off-screen is what makes an
                                // expanded row come back blank.
                                removeClippedSubviews={false}
                            />
                        )
                    })()}

                    {/* Under the list rather than in the header: it is the way out of this
                        sheet, not one of the things it does. Muted and outlined so it reads
                        as the fallback it is — most picks should come off the board. */}
                    {onEnterManually && (
                        <Pressable
                            onPress={onEnterManually}
                            style={({ pressed }) => ({
                                marginTop: spacing.sm,
                                paddingVertical: spacing.md,
                                borderRadius: 12, borderWidth: 1, borderColor: colors.cardBorder,
                                alignItems: "center",
                                backgroundColor: pressed ? colors.inputBackground : "transparent",
                            })}
                        >
                            <Text style={{ ...typography.body, color: colors.textSecondary, fontWeight: "600" }}>
                                Enter manually
                            </Text>
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Rendered inside this sheet rather than as its own modal. Two modals dismissing
                while a third is asked to present is a transition iOS declines to make, and
                it declines silently — which is how choosing a player left nothing open. */}
            {pending && (
                <ConfirmTarget
                    pending={pending}
                    onCancel={() => setPending(null)}
                    onConfirm={target => {
                        setPending(null)
                        onSelect({
                            target, propType: pending.propType, line: pending.line,
                            direction: pending.direction, odds: pending.odds,
                        })
                    }}
                />
            )}
        </AppModal>
    )
}

/**
 * Shown when the book's name did not land on exactly one ESPN player.
 *
 * Rather than picking the closest and hoping, this asks — a mismatched name here would
 * attach the bet to the wrong person and settle it against their stats.
 */
function ConfirmTarget({ pending, onCancel, onConfirm }: {
    pending: Pending
    onCancel: () => void
    onConfirm: (target: PlayerTeamResult) => void
}) {
    return (
        <Pressable
            onPress={onCancel}
            style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                justifyContent: "center", alignItems: "center",
                backgroundColor: colors.overlay, padding: spacing.xl,
            }}
        >
                <View style={{
                    width: "100%", backgroundColor: colors.backgroundSecondary,
                    borderRadius: 20, padding: spacing.xl, gap: spacing.md,
                    borderWidth: 1, borderColor: colors.cardBorder, ...shadows.modal,
                }}>
                    <Text style={{ ...typography.heading, color: colors.textPrimary }}>
                        Which {pending.player.name}?
                    </Text>
                    <Text style={{ ...typography.caption, color: colors.textSecondary }}>
                        {pending.candidates.length === 0
                            ? "That name did not match anyone. Close this and enter the pick by hand."
                            : "The sportsbook's name did not match exactly one player, so pick the right one."}
                    </Text>

                    {pending.candidates.slice(0, 6).map(c => (
                        <Pressable
                            key={c.identifier}
                            onPress={() => onConfirm(c)}
                            style={{
                                paddingVertical: spacing.md, paddingHorizontal: spacing.md,
                                borderRadius: 10, borderWidth: 1, borderColor: colors.cardBorder,
                            }}
                        >
                            <Text style={{ ...typography.body, color: colors.textPrimary }}>
                                {playerTeamDisplay(c)}
                            </Text>
                        </Pressable>
                    ))}

                <Pressable onPress={onCancel} style={{ alignSelf: "flex-end", padding: spacing.sm }}>
                    <Text style={{ ...typography.body, color: colors.textSecondary }}>Cancel</Text>
                </Pressable>
            </View>
        </Pressable>
    )
}
