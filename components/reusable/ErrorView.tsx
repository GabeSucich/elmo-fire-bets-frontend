import { Text, View } from "react-native"

type Props = {
    errorMsg: string | null
}

export default function ErrorView({errorMsg}: Props) {
    if (!errorMsg) return null

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{color: "red"}}>{ errorMsg }</Text>
        </View>
    )
}