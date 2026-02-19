import { GamblerSeason } from "@/composables/useListSeasons";
import { User } from "@/contexts/authContext";
import { SeasonSelectionScreen } from "@/screens/SeasonSelectionScreen";
import SeasonView from "@/screens/SeasonView";
import { DarkTheme, NavigationContainer, NavigationIndependentTree, Theme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

const BlackTheme: Theme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        background: "#000000",
    },
};

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
        <NavigationContainer theme={BlackTheme}>
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