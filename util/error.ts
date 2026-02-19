import { ApiError } from "@/api";

export function setApiErrorMsg(
    error: any, 
    msgSetter: (msg: string) => void,
    defaultError: string
) {
    console.error(error)
    const errorMsg = error instanceof ApiError ? (error.body.detail ?? defaultError) : defaultError
    msgSetter(errorMsg)
}