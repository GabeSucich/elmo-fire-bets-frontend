import React, { createContext, useContext, useReducer, ReactNode, useState, useEffect } from "react";
import { clearStoredSession, setUnauthorizedHandler, storeSession } from "@/util/authSession";
import { ApiError, AuthService } from "../api";
import { setApiErrorMsg } from "@/util/error";
import { useLoadingState } from "@/composables/useLoadingState";
import { useToastContext } from "@/contexts/toastContext";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null,
  loginLoading: boolean,
  /** Resolves true when the login succeeded, false when it failed (the failure is surfaced as a toast). */
  attemptLogin: (u: string, p: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const {
    loading,
    setLoading
  } = useLoadingState()

  const { showToast } = useToastContext()

  const [user, setUser] = useState<User | null>(null)

  // A 401 from any request means the session is no longer good: the stored
  // credentials are cleared and dropping the user resets the app to the login screen.
  useEffect(() => setUnauthorizedHandler(() => {
    setUser(null)
    showToast("Your session expired. Please log in again.")
  }), [showToast])

  const attemptLogin = async (u: string, p: string) => {
    setLoading(true)
    try {
      const response = await AuthService.login({ username: u, password: p });
      await storeSession(u, p, response.token)
      setUser({id: response.user_id, firstName: response.first_name, lastName: response.last_name})
      return true
    } catch (e) {
      await clearStoredSession()
      setApiErrorMsg(e, message => showToast(message), "Unknown issue occurred while logging in")
      return false
    } finally {
      setLoading(false)
    }
  };

  return (
    <AuthContext.Provider value={{ user, attemptLogin, loginLoading: loading }}>
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
