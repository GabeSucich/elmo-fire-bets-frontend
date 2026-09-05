import { ToastOptions, useToastContext } from "@/contexts/toastContext";
import { setApiErrorMsg } from "@/util/error";
import { Dispatch, SetStateAction } from "react";

export type ApiActionToastOptions = Omit<ToastOptions, "action"> & {
    /**
     * Raise a sticky toast with a Retry button that re-runs the failed call with the same args.
     * Use for loads whose failure leaves the screen with nothing to render — an auto-dismissing
     * toast over a blank screen strands the user.
     */
    retryable?: boolean
}

export default function useApiActionState<U extends unknown[], V>(
    action: (...args: U) => Promise<V>,
    withResult: (result: V) => any | null,
    setLoading: Dispatch<SetStateAction<boolean>>,
    defaultErrorMsg: string,
    opts?: ApiActionToastOptions
) {
    const { showToast } = useToastContext()

    function execute(...args: U) {
        setLoading(true)
        action(...args)
            .then(res => {
                if (withResult) return withResult(res)
            })
            .catch(e => {
                setApiErrorMsg(
                    e,
                    message => {
                        const { retryable, ...toastOptions } = opts ?? {}
                        showToast(message, retryable
                            ? {
                                sticky: true,
                                ...toastOptions,
                                action: { label: "Retry", onPress: () => execute(...args) },
                            }
                            : toastOptions
                        )
                    },
                    defaultErrorMsg ?? "An unexpected issue occurred..."
                )
                return
            })
            .finally(() => {
                setLoading(false)

            })

    }

    return {
        execute
    }
}
