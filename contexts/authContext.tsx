import React, { createContext, useContext, useReducer, ReactNode, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiError, AuthService } from "../api";
import { setApiErrorMsg } from "@/util/error";
import { useErrorLoadingStates } from "@/composables/useErrorLoadingStates";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null,
  loginLoading: boolean,
  loginError: string | null,
  attemptLogin: (u: string, p: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const {
    error,
    loading,
    setLoading,
    setError
  } = useErrorLoadingStates()

  const [user, setUser] = useState<User | null>(null)

  const attemptLogin = async (u: string, p: string) => {
    setError(null)
    setLoading(true)
    try {
      const response = await AuthService.login({ username: u, password: p });
      await AsyncStorage.setItem("username", u);
      await AsyncStorage.setItem("password", p);
      await AsyncStorage.setItem("token", response.token)
      setUser({id: response.user_id, firstName: response.first_name, lastName: response.last_name})
    } catch (e) {
      setApiErrorMsg(e, setError, "Unknown issue occurred while logging in")
    } finally {
      setLoading(false)
    }
  };

  return (
    <AuthContext.Provider value={{ user, attemptLogin, loginError: error, loginLoading: loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be called from within a provider");
  }
  return context;
}
