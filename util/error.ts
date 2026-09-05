import { ApiError } from "@/api";

export function setApiErrorMsg(
    error: any, 
    msgSetter: (msg: string) => void,
    defaultError: string
) {
    // Deliberately not console.error: these failures are handled — the caller surfaces them as a
    // toast — and console.error trips React Native's LogBox, which renders in its own root view
    // above the app and covers the toast in dev.
    console.log("[api error]", error)
    const errorMsg = error instanceof ApiError ? (error.body.detail ?? defaultError) : defaultError
    msgSetter(errorMsg)
}