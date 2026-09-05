import React from "react";
import SelectableTile from "./SelectableTile";
import { ScrollView, StyleProp, View, ViewStyle } from "react-native";
import { TileSize, TileStyleProps } from "./common";
import { spacing } from "@/theme/colors";

type Props<T> = {
    selectedItem: T | null
    items: T[]
    handleSelect: (t: T) => void
    handleUnselect?: (t: T) => void
    itemDisplay: (t: T) => string | string
    itemKey: (t: T) => string
    itemStyle?: (t: T) => Partial<TileStyleProps>
    raiseSelection?: boolean
    containerProps?: StyleProp<ViewStyle>
    noScroll?: boolean
    tileSize?: TileSize
}

export default function SelectableTileGroup<T>(props: Props<T>) {
    function filteredOptions() {
        if (props.raiseSelection) {
            return props.items.filter(t => t !== props.selectedItem)
        }
        return props.items
    }

    if (props.noScroll) {
        return (
            <View style={[
                props.containerProps,
                { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: spacing.xs }
                ]}>
                {
                    props.items.map(item => {
                        return (
                            <SelectableTile
                                item={item}
                                isSelected={item === props.selectedItem}
                                tileStyles={props.itemStyle && props.itemStyle(item)}
                                display={props.itemDisplay}
                                key={props.itemKey(item)}
                                handleSelect={() => props.handleSelect(item)}
                                handleUnselect={props.handleUnselect}
                                style={{
                                    marginTop: spacing.xs
                                }}
                                size={props.tileSize}
                            />
                        )
                    })
                }
            </View>
        )
    }

    return (
        <View style={props.containerProps}>
            { props.raiseSelection && props.selectedItem &&
                <View style={{ flexDirection: 'row', marginBottom: spacing.sm }}>
                    <SelectableTile
                        isSelected={true}
                        item={props.selectedItem}
                        display={props.itemDisplay}
                        handleSelect={props.handleSelect}
                        handleUnselect={props.handleUnselect}
                        tileStyles={props.itemStyle && props.itemStyle(props.selectedItem)}
                        key={props.itemKey(props.selectedItem)}
                        size={props.tileSize}
                    />
                </View>
            }
            <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                >
                    {
                        filteredOptions().map(item => {
                            return (
                                <SelectableTile
                                    item={item}
                                    isSelected={item === props.selectedItem}
                                    tileStyles={props.itemStyle && props.itemStyle(item)}
                                    display={props.itemDisplay}
                                    key={props.itemKey(item)}
                                    handleSelect={() => props.handleSelect(item)}
                                    handleUnselect={props.handleUnselect}
                                    size={props.tileSize}
                                />
                            )
                        })
                    }
            </ScrollView>
        </View>
    )

}
