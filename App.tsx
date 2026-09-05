import { configureApi } from "@/util/apiConfig";
import ToastHost from "@/components/reusable/ToastHost";
import { AuthProvider, useAuthContext } from "@/contexts/authContext";
import { ToastProvider } from "@/contexts/toastContext";
import LoginScreen from "@/screens/LoginScreen";
import React from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Main from "./Main";

// Point the generated API client at the right host before anything renders.
configureApi();

export default function RootComponent() {
  return (
    <SafeAreaProvider>
      <ToastProvider>
        <AuthProvider>
          <View style={{ flex: 1 }}>
            <AuthOrMain />
            <ToastHost />
          </View>
        </AuthProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}

function AuthOrMain() {
  const {user} = useAuthContext()

  return (
    user ?
      <Main user={user}/>
      : <LoginScreen />
  )
}
