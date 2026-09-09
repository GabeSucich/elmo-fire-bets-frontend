import React from "react";
import { View } from "react-native";
import { colors } from "@/theme/colors";

type Props = {
    children: React.ReactNode
}

export default function Overlay({ children }: Props) {
    return (
        <View style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: colors.scrim,
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 12,
            zIndex: 10,
        }}>
            {children}
        </View>
    )
}
