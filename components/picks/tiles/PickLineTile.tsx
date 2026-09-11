import { PickResponseData, PropBetDirection } from "@/api";
import React from "react";
import Tile from "../../reusable/tiles/Tile";
import { TileSize } from "../../reusable/tiles/common";
import { PickDisplayUtil } from "@/util/picks";
import { colors } from "@/theme/colors";

type Props = {
    pick: PickResponseData
    showVeto?: boolean
    size?: TileSize
}

export default function PickLineTile({ pick, showVeto = true, size = "sm" }: Props) {
    const { lineDisplay, directionDisplay } = PickDisplayUtil.lineAndDirectionDisplay(
        pick,
        showVeto,
        pick.sauce_factor ?? undefined
    )

    return (
        <Tile<string>
            item={lineDisplay}
            display={lineDisplay}
            tileStyles={{
                primaryColor: directionDisplay === PropBetDirection.OVER ? colors.success : colors.danger
            }}
            size={size}
        />
    )
}
