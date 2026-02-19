import React from "react";
import { View } from "react-native";

type Props = {
    children: React.ReactNode
}

export default function Overlay({ children }: Props) {
    return (
        <View style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(255,255,255,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: 10,
            zIndex: 10,
        }}>
            {children}
        </View>
    )
}
