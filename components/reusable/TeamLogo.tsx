import React, { useState } from "react"
import { Image, Text } from "react-native"
import { colors, typography } from "@/theme/colors"

/** Roughly cap height, so a logo sits level with the name beside it. */
const LOGO_SIZE = 22

/**
 * The variant drawn for dark surfaces, which is every surface this app has.
 *
 * ESPN lightens the marks that need it and leaves the rest alone: of the thirty-two, only
 * eight differ from the standard set, and all eight improve. The Giants' "ny" is navy in
 * the default and all but disappears on our background; the Jets are dark green and go
 * white; Green Bay, Dallas, the Rams and the Raiders gain a light outline. The other
 * twenty-four are byte-identical, so nothing is traded away for the fix.
 */
const LOGO_VARIANT = "500-dark"

/**
 * A team's mark, in place of its abbreviation.
 *
 * ESPN serves these publicly, keyed on abbreviations — and conveniently, both the codes we
 * store on a target and the ones the book sends resolve after nothing but a lowercase. All
 * thirty the book uses were checked, awkward ones included ("la" is the Rams, "lv" the
 * Raiders, "was" the Commanders), as were ESPN's own variants ("lar", "wsh"). So there is
 * no mapping table here to fall out of step with a rebrand.
 *
 * Falls back to the abbreviation rather than to a gap. The image is remote, so it is one
 * dropped connection away from telling you nothing about whose line you are looking at.
 */
export default function TeamLogo({ team, size = LOGO_SIZE }: { team: string | null | undefined, size?: number }) {
    const [failed, setFailed] = useState(false)
    if (!team) return null
    if (failed) {
        return (
            <Text style={{
                ...typography.small, color: colors.textMuted, fontWeight: "700",
                // A minimum rather than a fixed width: it holds the column for a three
                // letter code without clipping a value that turns out to be longer.
                minWidth: size, textAlign: "center",
            }}>
                {team}
            </Text>
        )
    }
    return (
        <Image
            source={{ uri: `https://a.espncdn.com/i/teamlogos/nfl/${LOGO_VARIANT}/${team.toLowerCase()}.png` }}
            onError={() => setFailed(true)}
            style={{ width: size, height: size }}
            resizeMode="contain"
            accessibilityLabel={team}
        />
    )
}
