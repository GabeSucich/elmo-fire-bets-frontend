import { configureApi } from "@/util/apiConfig";
import ActivityLoader from "@/components/reusable/ActivityLoader";
import OverlayLoader from "@/components/reusable/OverlayLoader";
import ToastHost from "@/components/reusable/ToastHost";
import { AuthProvider, useAuthContext } from "@/contexts/authContext";
import { ToastProvider } from "@/contexts/toastContext";
import LoginScreen from "@/screens/LoginScreen";
import React from "react";
import { View } from "react-native";
import { colors } from "@/theme/colors";
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
  const { user, reauthenticating, restoring } = useAuthContext()

  // Reading the stored session off disk. Milliseconds, and unlabelled — naming it would
  // flash a word nobody has time to read.
  if (restoring) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ActivityLoader />
      </View>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  // The app renders on the stored session and only says anything if a request comes back
  // unauthorised, at which point it signs back in behind this overlay rather than
  // dropping someone at the login screen.
  return (
    <>
      <Main user={user} />
      {reauthenticating && <OverlayLoader loaderProps={{ text: "Reauthenticating..." }} />}
    </>
  )
}
