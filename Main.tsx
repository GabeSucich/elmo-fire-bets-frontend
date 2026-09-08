import { GamblerSeason } from "@/composables/useListSeasons";
import { User } from "@/contexts/authContext";
import { SeasonSelectionScreen } from "@/screens/SeasonSelectionScreen";
import SeasonView from "@/screens/SeasonView";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SeasonHeaderMenu from "@/components/navigation/SeasonHeaderMenu";
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
                        options={({ route, navigation }) => ({
                            // The chevron is gone in favour of the menu opposite it: it read
                            // as "up one step" when the action actually leaves the season, and
                            // two controls doing the same job made the wrong one look like a
                            // tab-level back. The swipe-back gesture still works.
                            headerBackVisible: false,
                            headerRight: () => (
                                <SeasonHeaderMenu
                                    // Pops back to the season list rather than pushing a new
                                    // copy of it, so the stack does not grow every time and
                                    // the transition reads as going back, which it is.
                                    onAllSeasons={() => navigation.goBack()}
                                />
                            ),
                            // Who you are signed in as only matters while testing, where
                            // several accounts get used against the same season.
                            title: __DEV__
                                ? `${route.params.season.name} (${user.firstName})`
                                : route.params.season.name
                        })}
                    />
                </Stack.Navigator>
            </NavigationContainer>
    )
}
