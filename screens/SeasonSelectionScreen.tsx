import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { GamblingSeasonService, GamblingSeasonState } from "@/api";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { GamblerSeason, useListSeasons } from "@/composables/useListSeasons";
import { MainStackParamList } from "@/Main";
import ActivityLoader from "@/components/reusable/ActivityLoader";
import ErrorView from "@/components/reusable/ErrorView";

type NavigationProp = NativeStackNavigationProp<MainStackParamList, "SeasonSelector">
type SeasonSelectionRouteProp = RouteProp<MainStackParamList, "SeasonSelector">

export function SeasonSelectionScreen() {
  const navigation = useNavigation<NavigationProp>()
  const route = useRoute<SeasonSelectionRouteProp>()
  
  const { gamblerSeasons, loading, error } = useListSeasons()

  function setGamblerSeason(season: GamblerSeason) {
    navigation.navigate("Season", { season })
  }

  if (loading) {
    return (
      <ActivityLoader/>
    );
  }

  return (
    <View style={styles.container}>
      <ErrorView errorMsg={error}/>
      {gamblerSeasons.map((season) => {
        return (
          <TouchableOpacity
            key={season.seasonId}
            style={styles.card}
            onPress={() => setGamblerSeason(season)}
          >
            <View style={styles.cardContent}>
              <Text style={[styles.name]}>
                {season.name}
              </Text>
              <Text style={[styles.year]}>
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
              <Text style={styles.stateText}>{season.state}</Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    color: "red",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    position: "relative",
  },
  cardSelected: {
    borderColor: "#007AFF",
    backgroundColor: "#f0f8ff",
  },
  cardContent: {
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  year: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  textSelected: {
    color: "#007AFF",
  },
  stateBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stateBadgeInProgress: {
    backgroundColor: "#fff3cd",
  },
  stateBadgeComplete: {
    backgroundColor: "#d4edda",
  },
  stateText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#333",
  },
});