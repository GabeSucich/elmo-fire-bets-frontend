import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { GamblingSeasonState } from "@/api";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { GamblerSeason, useListSeasons } from "@/composables/useListSeasons";
import { MainStackParamList } from "@/Main";
import ActivityLoader from "@/components/reusable/ActivityLoader";
import { colors, shadows, typography, spacing } from "@/theme/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LAST_SEASON_KEY = "lastSeasonId"

/**
 * Whether this launch has already jumped straight into a season.
 *
 * Module scope rather than state, so it survives the screen being remounted. Without it,
 * navigating back to the season list would immediately bounce you into the season again
 * and there would be no way to reach the list at all.
 */
let hasAutoOpenedSeason = false

type NavigationProp = NativeStackNavigationProp<MainStackParamList, "SeasonSelector">
type SeasonSelectionRouteProp = RouteProp<MainStackParamList, "SeasonSelector">

export function SeasonSelectionScreen() {
  const navigation = useNavigation<NavigationProp>()
  const route = useRoute<SeasonSelectionRouteProp>()

  const { gamblerSeasons, loading } = useListSeasons()

  function setGamblerSeason(season: GamblerSeason) {
    hasAutoOpenedSeason = true
    AsyncStorage.setItem(LAST_SEASON_KEY, String(season.seasonId)).catch(() => {})
    navigation.navigate("Season", { season })
  }

  useEffect(() => {
    if (hasAutoOpenedSeason || loading || gamblerSeasons.length === 0) return

    let cancelled = false
    AsyncStorage.getItem(LAST_SEASON_KEY).then(storedId => {
      if (cancelled || !storedId) return
      // A season the user no longer has — a different account, or one that went away —
      // simply falls through to the list.
      const season = gamblerSeasons.find(s => String(s.seasonId) === storedId)
      if (!season) return
      hasAutoOpenedSeason = true
      navigation.navigate("Season", { season })
    }).catch(() => {})

    return () => { cancelled = true }
  }, [loading, gamblerSeasons])

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityLoader key={"this-first"} text="Loading seasons..." color={colors.textPrimary}/>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {gamblerSeasons.map((season) => {
        return (
          <TouchableOpacity
            key={season.seasonId}
            style={styles.card}
            onPress={() => setGamblerSeason(season)}
            activeOpacity={0.8}
          >
            <View style={styles.cardContent}>
              <Text style={styles.name}>
                {season.name}
              </Text>
              <Text style={styles.year}>
                {season.year}
              </Text>
            </View>
            <View
              style={[
                styles.stateBadge,
                season.state === GamblingSeasonState.COMPLETE
                  ? styles.stateBadgeComplete
                  : styles.stateBadgeInProgress,
              ]}
            >
              <Text style={[
                styles.stateText,
                season.state === GamblingSeasonState.COMPLETE
                  ? styles.stateTextComplete
                  : styles.stateTextInProgress,
              ]}>{season.state}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    color: colors.danger,
    fontSize: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    position: "relative",
    ...shadows.card,
  },
  cardSelected: {
    borderColor: colors.accent,
  },
  cardContent: {
    marginBottom: spacing.sm,
  },
  name: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  year: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  textSelected: {
    color: colors.accent,
  },
  stateBadge: {
    position: "absolute",
    bottom: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 6,
  },
  stateBadgeInProgress: {
    backgroundColor: colors.warningLight,
  },
  stateBadgeComplete: {
    backgroundColor: colors.successLight,
  },
  stateText: {
    ...typography.small,
    fontWeight: "600",
  },
  stateTextInProgress: {
    color: colors.warning,
  },
  stateTextComplete: {
    color: colors.successDark,
  },
});
