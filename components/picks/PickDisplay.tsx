import { PickResponseData } from "@/api";
import React from "react";
import { ScrollView } from "react-native";
import { TileSize } from "../reusable/tiles/common";
import PickTargetTile from "./tiles/PickTargetTile";
import PickLineTile from "./tiles/PickLineTile";
import PickBetTypeTile from "./tiles/PickBetTypeTile";

type Props = {
    pick: PickResponseData
    showVeto?: boolean
    size?: TileSize
}

export default function PickDisplay({pick, showVeto=true, size = "sm"}: Props) {
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, paddingVertical: 10 }} contentContainerStyle={{ flexDirection: 'row', alignItems: 'center' }}>
            <PickTargetTile pick={pick} size={size} />
            <PickLineTile pick={pick} showVeto={showVeto} size={size} />
            <PickBetTypeTile pick={pick} size={size} />
        </ScrollView>
    )
}
