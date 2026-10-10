'use client'

import { useQuery } from 'convex/react'
import { api } from '@ella/backend/api'
import { useCallback, useMemo } from 'react'

/**
 * Hook to access the current user's permissions.
 *
 * Wraps `users.me` and exposes `hasPermission()` for fine-grained access checks.
 */
export function usePermissions() {
  const data = useQuery(api.functions.users.me)

  const permissions = useMemo(
    () => (data?.effectivePermissions ?? []) as string[],
    [data?.effectivePermissions],
  )

  const hasPermission = useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions],
  )

  return {
    /** Server-computed effective permissions (role + overrides) */
    permissions,
    /** Check if current user has a specific permission */
    hasPermission,
    /** True while the query is still loading */
    isLoading: data === undefined,
  } as const
}
