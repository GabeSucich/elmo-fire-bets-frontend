import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";

export type ToastSeverity = "error" | "success" | "info"

export type ToastAction = {
    label: string
    onPress: () => void
}

export type ToastOptions = {
    severity?: ToastSeverity
    /** Sticky toasts never auto-dismiss. Use for failures that leave the screen with nothing to show. */
    sticky?: boolean
    action?: ToastAction
    /** Toasts sharing a key replace one another. Defaults to the message text. */
    dedupeKey?: string
    durationMs?: number
}

export type ToastItem = {
    id: string
    message: string
    severity: ToastSeverity
    sticky: boolean
    action?: ToastAction
    dedupeKey: string
}

export type ToastHostId = symbol

const DEFAULT_DURATION_MS = 5000
const MAX_VISIBLE_TOASTS = 3

let toastCounter = 0
function nextToastId() {
    toastCounter += 1
    return `toast-${toastCounter}`
}

interface ToastContextType {
    toasts: ToastItem[]
    showToast: (message: string, opts?: ToastOptions) => string
    dismiss: (id: string) => void
    dismissAll: () => void
    /**
     * Hosts register themselves on mount. Only the most recently mounted one renders, which is how
     * toasts surface above a React Native Modal — a Modal is a separate native view hierarchy, so a
     * host at the app root cannot paint over it.
     */
    registerHost: (id: ToastHostId) => void
    unregisterHost: (id: ToastHostId) => void
    topHost: ToastHostId | null
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([])
    const [hostStack, setHostStack] = useState<ToastHostId[]>([])
    const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

    const dismiss = useCallback((id: string) => {
        const timer = timers.current.get(id)
        if (timer) {
            clearTimeout(timer)
            timers.current.delete(id)
        }
        setToasts(prev => prev.some(t => t.id === id) ? prev.filter(t => t.id !== id) : prev)
    }, [])

    const dismissAll = useCallback(() => {
        timers.current.forEach(timer => clearTimeout(timer))
        timers.current.clear()
        setToasts([])
    }, [])

    const showToast = useCallback((message: string, opts: ToastOptions = {}) => {
        const id = nextToastId()
        const toast: ToastItem = {
            id,
            message,
            severity: opts.severity ?? "error",
            sticky: opts.sticky ?? false,
            action: opts.action,
            dedupeKey: opts.dedupeKey ?? message,
        }

        // A superseded toast's timer is left to fire on its own — dismiss() is keyed by id, so it
        // becomes a no-op and cleans its own map entry.
        setToasts(prev => [...prev.filter(t => t.dedupeKey !== toast.dedupeKey), toast].slice(-MAX_VISIBLE_TOASTS))

        if (!toast.sticky) {
            timers.current.set(id, setTimeout(() => dismiss(id), opts.durationMs ?? DEFAULT_DURATION_MS))
        }

        return id
    }, [dismiss])

    const registerHost = useCallback((id: ToastHostId) => {
        setHostStack(prev => [...prev.filter(host => host !== id), id])
    }, [])

    const unregisterHost = useCallback((id: ToastHostId) => {
        setHostStack(prev => prev.filter(host => host !== id))
    }, [])

    useEffect(() => {
        const pending = timers.current
        return () => {
            pending.forEach(timer => clearTimeout(timer))
            pending.clear()
        }
    }, [])

    const topHost = hostStack.length > 0 ? hostStack[hostStack.length - 1] : null

    return (
        <ToastContext.Provider
            value={{ toasts, showToast, dismiss, dismissAll, registerHost, unregisterHost, topHost }}
        >
            {children}
        </ToastContext.Provider>
    );
}

export function useToastContext() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToastContext must be called from within a ToastProvider");
    }
    return context;
}
