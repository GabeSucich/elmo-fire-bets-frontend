import { GamblerSeason } from "@/composables/useListSeasons";
import { User } from "@/contexts/authContext";
import { SeasonSelectionScreen } from "@/screens/SeasonSelectionScreen";
import SeasonView from "@/screens/SeasonView";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { colors } from "@/theme/colors";

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

const AppTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        background: colors.background,
        card: colors.backgroundSecondary,
        text: colors.textPrimary,
        border: colors.cardBorder,
        primary: colors.accent,
    },
};

export default function Main({user}: Props) {
    return (
        <NavigationContainer theme={AppTheme}>
                <Stack.Navigator
                    screenOptions={{
                        headerStyle: {
                            backgroundColor: colors.backgroundSecondary,
                        },
                        headerTintColor: colors.textPrimary,
                        headerTitleStyle: {
                            fontWeight: '600',
                        },
                    }}
                >
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
                            // Who you are signed in as only matters while testing, where
                            // several accounts get used against the same season.
                            title: __DEV__
                                ? `${route.route.params.season.name} (${user.firstName})`
                                : route.route.params.season.name
                        })}
                    />
                </Stack.Navigator>
            </NavigationContainer>
    )
}
