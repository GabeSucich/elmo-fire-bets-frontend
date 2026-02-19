import React from "react";
import Overlay from "./Overlay";
import ActivityLoader, { ActivityLoaderProps } from "./ActivityLoader";

type Props = {
    loaderProps?: ActivityLoaderProps
}

export default function OverlayLoader({ loaderProps }: Props) {
    return (
        <Overlay>
            <ActivityLoader {...loaderProps} />
        </Overlay>
    )
}
