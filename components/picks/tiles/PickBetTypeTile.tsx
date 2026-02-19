import { PickResponseData, PropBetType } from "@/api";
import React from "react";
import Tile from "../../reusable/tiles/Tile";
import { TileSize } from "../../reusable/tiles/common";
import { betTypeToColor } from "@/util/betTypes";

type Props = {
    pick: PickResponseData
    size?: TileSize
}

export default function PickBetTypeTile({ pick, size = "sm" }: Props) {
    return (
        <Tile<PropBetType>
            item={pick.prop_type}
            display={s => s}
            tileStyles={{
                primaryColor: betTypeToColor(pick.prop_type)
            }}
            size={size}
        />
    )
}
