import AsyncStorage from "@react-native-async-storage/async-storage";

/** Keys used for the credentials persisted at login. */
export const TOKEN_KEY = "token";
export const USERNAME_KEY = "username";
export const PASSWORD_KEY = "password";
export const USER_KEY = "user";

const SESSION_KEYS = [TOKEN_KEY, USERNAME_KEY, PASSWORD_KEY, USER_KEY];

export type StoredUser = { id: number, firstName: string, lastName: string }

export function getStoredToken() {
    return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredUser(): Promise<StoredUser | null> {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as StoredUser;
    } catch {
        // Corrupt or from an older shape: treat it as no session rather than crashing.
        return null;
    }
}

export type StoredCredentials = { username: string, password: string }

/** What a silent re-login needs. Null unless a previous login stored both halves. */
export async function getStoredCredentials(): Promise<StoredCredentials | null> {
    const [[, username], [, password]] = await AsyncStorage.multiGet([USERNAME_KEY, PASSWORD_KEY])
    return username && password ? { username, password } : null
}

export async function storeSession(
    username: string,
    password: string,
    token: string,
    user: StoredUser,
) {
    await AsyncStorage.multiSet([
        [USERNAME_KEY, username],
        [PASSWORD_KEY, password],
        [TOKEN_KEY, token],
        // Kept so a relaunch can render the app straight away. Whether the token is still
        // good is settled by the first real request, not by a login round trip on boot.
        [USER_KEY, JSON.stringify(user)],
    ]);
    // A fresh session re-arms the 401 handler for the next expiry.
    handlingUnauthorized = false;
}

export async function clearStoredSession() {
    await AsyncStorage.multiRemove(SESSION_KEYS);
}

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

/**
 * Registered by the auth provider so a 401 can drop the user back to the login
 * screen. Returns an unsubscribe function.
 */
export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
    unauthorizedHandler = handler;
    return () => {
        if (unauthorizedHandler === handler) {
            unauthorizedHandler = null;
        }
    };
}

// Concurrent requests can all 401 at once; only the first should tear down the session.
let handlingUnauthorized = false;

export async function handleUnauthorized() {
    if (handlingUnauthorized) {
        return;
    }
    handlingUnauthorized = true;
    // Deliberately does not clear anything: the handler tries to re-authenticate from
    // the stored credentials first, and only drops the session if that fails. Clearing
    // here would destroy the very credentials the recovery needs.
    unauthorizedHandler?.();
}

/** Lets the handler re-arm once it has finished dealing with a 401. */
export function resetUnauthorizedGuard() {
    handlingUnauthorized = false;
}
