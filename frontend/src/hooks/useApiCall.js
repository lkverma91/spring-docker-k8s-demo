import { useState, useCallback } from 'react'

/**
 * Generic hook to execute an API function and track loading/result state.
 * @param {Function} apiFn - The API function to call (from productApi.js)
 */
export function useApiCall(apiFn) {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setResult(null)
    const res = await apiFn(...args)
    setResult(res)
    setLoading(false)
    return res
  }, [apiFn])

  const clear = useCallback(() => setResult(null), [])

  return { execute, result, loading, clear }
}
