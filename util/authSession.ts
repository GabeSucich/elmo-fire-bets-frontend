import AsyncStorage from "@react-native-async-storage/async-storage";

/** Keys used for the credentials persisted at login. */
export const TOKEN_KEY = "token";
export const USERNAME_KEY = "username";
export const PASSWORD_KEY = "password";

const SESSION_KEYS = [TOKEN_KEY, USERNAME_KEY, PASSWORD_KEY];

export function getStoredToken() {
    return AsyncStorage.getItem(TOKEN_KEY);
}

export async function storeSession(username: string, password: string, token: string) {
    await AsyncStorage.multiSet([
        [USERNAME_KEY, username],
        [PASSWORD_KEY, password],
        [TOKEN_KEY, token],
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
    await clearStoredSession();
    unauthorizedHandler?.();
}
