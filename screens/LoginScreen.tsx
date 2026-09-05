import { useAuthContext } from "@/contexts/authContext";
import { colors, shadows, typography, spacing } from "@/theme/colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { attemptLogin, loginLoading } = useAuthContext();

  const handleLogin = async () => {
    const succeeded = await attemptLogin(username, password);
    if (!succeeded) {
      setPassword("")
    }
  };

  async function loginFromStorage() {
    const storedUsername = (await AsyncStorage.getItem("username")) || ""
    const storedPassword = (await AsyncStorage.getItem("password")) || ""
    setPassword(storedPassword)
    setUsername(storedUsername)
    if (storedUsername && storedPassword) {
      // attemptLogin(storedUsername, storedPassword)
    }
  }

  useEffect(() => {
    if (!username && !password) {
      loginFromStorage()
    }
  }, [])

  const isDisabled = () => loginLoading || !(username && password)

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/elmo.png")}
        style={styles.logo}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <Text style={styles.title}>Elmo Fire Bets</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor={colors.textMuted}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textMuted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCorrect={false}
      />
      <TouchableOpacity
        style={[styles.button, isDisabled() && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isDisabled()}
      >
        <Text style={[styles.buttonText]}>
          {loginLoading ? "Logging in..." : "Login"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  logo: {
    width: 160,
    height: 176,
    alignSelf: "center",
    marginBottom: spacing.lg,
    borderRadius: 16,
  },
  title: {
    ...typography.title,
    fontSize: 28,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  buttonDisabled: {
    backgroundColor: colors.buttonDisabled,
    opacity: 0.7,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    fontSize: 16,
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
  },
  button: {
    backgroundColor: colors.accent,
    padding: spacing.lg,
    borderRadius: 12,
    alignItems: "center",
    marginTop: spacing.sm,
    ...shadows.card,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
});
