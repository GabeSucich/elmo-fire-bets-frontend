import { useAuthContext } from "@/contexts/authContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { attemptLogin, loginError, loginLoading } = useAuthContext();

  const handleLogin = () => {
    attemptLogin(username, password);
  };

  useEffect(() => {
    if (loginError) {
        setPassword("")
    }
  }, [loginError])

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
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {loginError && <Text style={styles.error}>{loginError}</Text>}
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
    padding: 20,
  },
  buttonDisabled: {
    backgroundColor: "#A0A0A0",
    opacity: 0.7,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  error: {
    color: "red",
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});