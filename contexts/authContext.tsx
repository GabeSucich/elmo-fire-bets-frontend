import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import {
  clearStoredSession,
  getStoredCredentials,
  getStoredUser,
  resetUnauthorizedGuard,
  setUnauthorizedHandler,
  storeSession,
} from "@/util/authSession";
import { AuthService } from "../api";
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
  /** True while the app is signing back in from stored credentials, at launch or after a 401. */
  reauthenticating: boolean,
  /** Clears the stored session. Nothing server-side to revoke — the token is stateless. */
  logout: () => Promise<void>,
  /** True only while the stored session is read off disk at launch. */
  restoring: boolean,
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
  const [reauthenticating, setReauthenticating] = useState(false)
  // Only covers reading the stored session off disk, which is milliseconds.
  const [restoring, setRestoring] = useState(true)

  /**
   * Signs back in from the credentials kept at login.
   *
   * Used both on launch and on a 401. Tokens do lapse eventually, and the alternative to
   * this is showing the login screen to someone who never asked to be signed out.
   */
  async function restoreSession(): Promise<boolean> {
    const stored = await getStoredCredentials()
    if (!stored) return false
    try {
      const response = await AuthService.login({ username: stored.username, password: stored.password })
      const restored = { id: response.user_id, firstName: response.first_name, lastName: response.last_name }
      await storeSession(stored.username, stored.password, response.token, restored)
      setUser(restored)
      return true
    } catch {
      // Wrong password, deleted account, backend down: nothing to recover to.
      return false
    }
  }

  /**
   * Launch straight into the app on the session that was stored.
   *
   * No login call here: the token is good for 30 days, so re-authenticating on every
   * cold start would make everyone watch a spinner to be told what is almost always
   * true. The first real request settles it, and a 401 triggers recovery below.
   */
  useEffect(() => {
    let cancelled = false
    getStoredUser()
      .then(stored => {
        if (!cancelled && stored) {
          setUser({ id: stored.id, firstName: stored.firstName, lastName: stored.lastName })
        }
      })
      .finally(() => {
        if (!cancelled) setRestoring(false)
      })
    return () => { cancelled = true }
  }, [])

  // A 401 means the token lapsed, which is not the same as the user wanting out. Try the
  // stored credentials first and only fall back to the login screen if they no longer work.
  useEffect(() => setUnauthorizedHandler(async () => {
    setReauthenticating(true)
    const recovered = await restoreSession()
    setReauthenticating(false)
    if (!recovered) {
      await clearStoredSession()
      setUser(null)
      showToast("Your session expired. Please log in again.")
    }
    resetUnauthorizedGuard()
  }), [showToast])

  /**
   * Signs out on this device.
   *
   * There is no server call: the token carries its own expiry and nothing tracks
   * sessions, so forgetting the credentials is the whole of it. They have to go, or the
   * launch restore and the 401 recovery would sign straight back in.
   */
  const logout = async () => {
    await clearStoredSession()
    setUser(null)
  }

  const attemptLogin = async (u: string, p: string) => {
    setLoading(true)
    try {
      const response = await AuthService.login({ username: u, password: p });
      const loggedIn = { id: response.user_id, firstName: response.first_name, lastName: response.last_name }
      await storeSession(u, p, response.token, loggedIn)
      setUser(loggedIn)
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
    <AuthContext.Provider value={{ user, attemptLogin, loginLoading: loading, reauthenticating, restoring, logout }}>
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
