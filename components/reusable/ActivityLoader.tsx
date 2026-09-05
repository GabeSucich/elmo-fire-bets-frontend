import { ColorValue, StyleProp, Text, View, ViewStyle } from "react-native"
import {
  LoaderKitView,
  IndicatorName,
  ALL_INDICATORS
} from 'react-native-loader-kit';
import { colors, typography } from "@/theme/colors";

export type ActivityLoaderProps = {
    text?: string
    name?: IndicatorName
    color?: ColorValue
    verticalAlign?: "top" | "center"
    containerStyle?: StyleProp<ViewStyle>
    loaderStyle?: StyleProp<ViewStyle>
    size?: number
}

function getRandomIndicator(): IndicatorName {
    return ALL_INDICATORS[Math.floor(Math.random() * ALL_INDICATORS.length)]
}

export default function ActivityLoader({
    text,
    name,
    color=colors.accent,
    verticalAlign="center",
    containerStyle,
    loaderStyle,
    size=50
}: ActivityLoaderProps) {
    const indicatorName: IndicatorName = name ?? getRandomIndicator()
    return (
        <View style={[
            {
                flex: 1,
                alignItems: "center",
                justifyContent: verticalAlign === "center" ? "center" : "flex-start",
                marginTop: verticalAlign === "top" ? 20 : 0
            },
            containerStyle,
        ]}>
            <LoaderKitView
                key={`loader-${text}`}
                name={indicatorName}
                style={[{ width: size, height: size }, loaderStyle]}
                color={color as string}
            />
            { text && <Text style={{ fontStyle: "italic", color: colors.textSecondary, marginTop: 20, ...typography.body }}>{ text }</Text> }
        </View>
    )
}
