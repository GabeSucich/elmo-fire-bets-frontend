import { ActivityIndicator, ActivityIndicatorProps, ColorValue, Text, View } from "react-native"
import {
  LoaderKitView,
  IndicatorName
} from 'react-native-loader-kit';

type Props = {
    text?: string
    name?: IndicatorName
    color?: ColorValue
}

export default function ActivityLoader(props: Props) {
    const indicatorName: IndicatorName = props.name ?? "BallPulse"
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <LoaderKitView 
                name={indicatorName} 
                style={{ width: 50, height: 50 }}
                color={props.color ?? "blue"}
            />
            { props.text && <Text style={{ fontStyle: "italic" }}>{ props.text }</Text> }
        </View>
    )
}