import { PickResponseData } from "@/api";
import React from "react";
import Tile from "../../reusable/tiles/Tile";
import { TileSize } from "../../reusable/tiles/common";
import { PickDisplayUtil } from "@/util/picks";
import { colors } from "@/theme/colors";

type Props = {
    pick: PickResponseData
    size?: TileSize
}

export default function PickTargetTile({ pick, size = "sm" }: Props) {
    const display = PickDisplayUtil.playerTeamDisplay(pick)

    return (
        <Tile<string>
            item={display}
            display={display}
            tileStyles={{ primaryColor: colors.buttonSecondary }}
            size={size}
        />
    )
}
