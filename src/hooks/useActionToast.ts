'use client'

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

interface ActionState {
  error?: string
  success?: string
}

/**
 * Watches a useActionState result and fires sonner toast on transitions.
 * Each unique success/error message triggers exactly one toast.
 */
export function useActionToast(state: ActionState | undefined) {
  const seen = useRef<{ error?: string; success?: string }>({})

  useEffect(() => {
    if (!state) return
    if (state.error && state.error !== seen.current.error) {
      seen.current.error = state.error
      toast.error(state.error)
    }
    if (state.success && state.success !== seen.current.success) {
      seen.current.success = state.success
      toast.success(state.success)
    }
  }, [state])
}
