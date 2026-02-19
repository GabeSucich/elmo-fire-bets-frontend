import React from "react"
import {  StyleProp, Text, TouchableOpacity, View, ViewStyle } from "react-native"
import { TileSize, TileStyleProps, extractStyleProps } from "./common"

type Props<T> = {
    item: T
    isSelected: boolean
    display: string | ((t: T) => string)
    handleSelect: (t: T) => void
    handleUnselect?: (t: T) => void
    tileStyles?: Partial<TileStyleProps>
    style?: StyleProp<ViewStyle>
    size?: TileSize
}

export default function SelectableTile<T>(props: Props<T>) {
    const {
        primaryColor,
        borderRadius,
        paddingHorizontal,
        paddingVertical,
        marginRight,
        fontSize
    } = extractStyleProps(props.tileStyles, props.size)

    function handlePress() {
        if (props.isSelected && props.handleUnselect) {
            props.handleUnselect(props.item)
        } else if (!props.isSelected) {
            props.handleSelect(props.item)
        }
    }

    return (
        <TouchableOpacity onPress={() => handlePress()}>
            <View style={[props.style, {
                backgroundColor: props.isSelected ? primaryColor : 'white',
                borderColor: primaryColor,
                borderWidth: 1,
                borderRadius,
                paddingHorizontal,
                paddingVertical,
                marginRight
            }]}>
                <Text
                    style={{
                        color: props.isSelected ? 'white' : primaryColor,
                        fontSize
                    }}
                >
                    { props.display instanceof Function ? props.display(props.item) : props.display }
                </Text>
            </View>
        </TouchableOpacity>
    )
}