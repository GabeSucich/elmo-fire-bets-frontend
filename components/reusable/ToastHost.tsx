import { useEffect, useRef } from "react"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { ToastHostId, useToastContext } from "@/contexts/toastContext"
import { spacing } from "@/theme/colors"
import Toast from "./Toast"

/**
 * Renders the toast queue floating above whatever it is mounted inside.
 *
 * Mount one at the app root and one inside each modal (AppModal does this for you). Only the
 * most recently mounted host paints, so an open modal's host wins and the toast is never
 * trapped behind it.
 */
export default function ToastHost() {
    const { toasts, dismiss, registerHost, unregisterHost, topHost } = useToastContext()
    const idRef = useRef<ToastHostId | null>(null)
    const insets = useSafeAreaInsets()

    if (idRef.current === null) {
        idRef.current = Symbol("toast-host")
    }

    useEffect(() => {
        const id = idRef.current!
        registerHost(id)
        return () => unregisterHost(id)
    }, [registerHost, unregisterHost])

    if (topHost !== idRef.current || toasts.length === 0) return null

    return (
        <View
            pointerEvents="box-none"
            style={{
                position: 'absolute',
                left: spacing.lg,
                right: spacing.lg,
                bottom: insets.bottom + spacing.lg,
            }}
        >
            {
                toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        toast={toast}
                        onDismiss={() => dismiss(toast.id)}
                        onAction={() => {
                            dismiss(toast.id)
                            toast.action?.onPress()
                        }}
                    />
                ))
            }
        </View>
    )
}
