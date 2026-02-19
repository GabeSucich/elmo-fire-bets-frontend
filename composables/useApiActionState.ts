import { setApiErrorMsg } from "@/util/error";
import { Dispatch, SetStateAction } from "react";

export default function useApiActionState<U extends unknown[], V>(
    action: (...args: U) => Promise<V>,
    withResult: (result: V) => any | null,
    setLoading: Dispatch<SetStateAction<boolean>>,
    setError: Dispatch<SetStateAction<string | null>>,
    defaultErrorMsg: string
) {

    function execute(...args: U) {
        setLoading(true)
        setError(null)
        action(...args)
            .then(res => {
                if (withResult) return withResult(res)
            })
            .catch(e => {
                setApiErrorMsg(e, setError, defaultErrorMsg ?? "An unexpected issue occurred...")
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