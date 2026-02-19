import { setApiErrorMsg } from "@/util/error";
import { Dispatch, SetStateAction, useState } from "react";

export default function useApiActionState<T>(
    action: () => Promise<T>,
    handlers: {
        setLoading: (loading: boolean) => void,
        setError: (error: any) => void
    },
    extraHandlers?: {
        onStart?: () => void
        onSuccess?: (result: T) => void
        onError?: (e: any) => void
        onDone?: () => void
    },
    defaultErrorMsg?: string
) {
    const {
        onDone,
        onError,
        onSuccess,
        onStart
    } = extraHandlers ?? {}

    function execute() {
        if (onStart) onStart()
        action()
            .then(res => {
                if (!onSuccess) return
                return onSuccess(res)
            })
            .catch(e => {
                if (!onError) return
                return onError(e)
            })
            .finally(() => {
                if (!onDone) return
                return onDone()
            })

    }

    return {
        execute
    }
}