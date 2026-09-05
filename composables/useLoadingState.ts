import { useState } from "react";

export function useLoadingState(initial: boolean = false) {
    const [loading, setLoading] = useState(initial)

    return {
        loading,
        setLoading
    }
}
