import React from "react"
import { StyleProp, Text, View, ViewStyle } from "react-native"
import { TileSize, TileStyleProps, extractStyleProps } from "./common"
import { colors } from "@/theme/colors"

type Props<T> = {
    item: T
    display: string | ((t: T) => string)
    tileStyles?: Partial<TileStyleProps>
    style?: StyleProp<ViewStyle>
    size?: TileSize
}

export default function Tile<T>(props: Props<T>) {
    const {
        primaryColor,
        borderRadius,
        paddingHorizontal,
        paddingVertical,
        marginRight,
        fontSize
    } = extractStyleProps(props.tileStyles, props.size)

    return (
        <View style={[props.style, {
            backgroundColor: primaryColor,
            borderColor: primaryColor,
            borderWidth: 1,
            borderRadius,
            paddingHorizontal,
            paddingVertical,
            marginRight
        }]}>
            <Text
                style={{
                    color: colors.textPrimary,
                    fontSize,
                    fontWeight: '500',
                }}
            >
                { props.display instanceof Function ? props.display(props.item) : props.display }
            </Text>
        </View>
    )
}
