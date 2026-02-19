import { ParlayResponseData } from "@/api";
import React from "react";
import BuildingParlayFooter from "./footers/BuildingParlayFooter";
import OpenParlayFooter from "./footers/OpenParlayFooter";
import ClosedParlayFooter from "./footers/ClosedParlayFooter";

type Props = {
    parlay: ParlayResponseData
}

export default function ParlayFooter({ parlay }: Props) {
    return (
        <>
            <BuildingParlayFooter parlay={parlay}/>
            <OpenParlayFooter parlay={parlay}/>
            <ClosedParlayFooter parlay={parlay}/>
        </>
    )
}
