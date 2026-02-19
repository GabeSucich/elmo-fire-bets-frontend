import { AuthProvider, useAuthContext, User } from "@/contexts/authContext";
import LoginScreen from "@/screens/LoginScreen";
import React from "react";
import Main from "./Main";

export default function RootComponent() {
  return (
    <AuthProvider>
      <AuthOrMain />
    </AuthProvider>
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