import { useState } from "react";

export function makeErrorLoadingStates() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    return {
        loading,
        setLoading,
        error,
        setError
    }
}