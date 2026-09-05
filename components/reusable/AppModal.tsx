import React from "react"
// eslint-disable-next-line no-restricted-imports -- the one place the raw Modal is allowed
import { Modal, ModalProps } from "react-native"
import ToastHost from "./ToastHost"

/**
 * Wraps React Native's Modal so every modal carries its own ToastHost.
 *
 * A Modal renders into a separate native view hierarchy, so the app-root ToastHost cannot paint
 * over it. Mounting a host inside means toasts raised while a modal is open surface above it
 * instead of behind it. Always use this in place of react-native's Modal.
 */
export default function AppModal({ children, ...modalProps }: ModalProps) {
    return (
        <Modal {...modalProps}>
            {children}
            <ToastHost />
        </Modal>
    )
}
