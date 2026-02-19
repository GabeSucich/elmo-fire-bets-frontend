import { GamblerSeason } from "@/composables/useListSeasons";
import { User } from "@/contexts/authContext";
import { SeasonSelectionScreen } from "@/screens/SeasonSelectionScreen";
import SeasonView from "@/screens/SeasonView";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

export type MainStackParamList = {
    SeasonSelector: {
        userId: number
    },
    Season: { 
        season: GamblerSeason,
    }
}

const Stack = createNativeStackNavigator<MainStackParamList>();

type Props = {
    user: User
}

export default function Main({user}: Props) {
    return (
        <NavigationContainer>
                <Stack.Navigator>
                    <Stack.Screen
                        name="SeasonSelector"
                        component={SeasonSelectionScreen}
                        initialParams={{userId: user.id}}
                        options={{
                            title: "Seasons"
                        }}
                    />
                    <Stack.Screen
                        name="Season"
                        component={SeasonView}
                        options={(route) => ({
                            headerBackButtonDisplayMode: 'minimal',
                            title: `${route.route.params.season.name} (${user.firstName})`
                        })}
                    />
                </Stack.Navigator>
            </NavigationContainer>
    )
}