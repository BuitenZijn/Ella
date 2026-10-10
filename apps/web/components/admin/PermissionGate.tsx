'use client'

import type { ReactNode } from 'react'
import { YStack, XStack, InfoCard, InfoCardText } from '@ella/ui'
import { ShieldOff } from 'lucide-react'
import { LoadingState } from '../common'
import { usePermissions } from '@/hooks/usePermissions'

export interface PermissionGateProps {
  /** Needed to see the page: the permission its queries require */
  permission: string
  children: ReactNode
}

/**
 * Renders an admin page only for users with the permission its queries need.
 *
 * Put the page's queries in the children: they don't run until the
 * permission is known, so a user without it sees "access required" instead of
 * a query error that blanks the app.
 */
export function PermissionGate({ permission, children }: PermissionGateProps) {
  const { hasPermission, isLoading } = usePermissions()

  if (isLoading) return <LoadingState />
  if (!hasPermission(permission)) {
    return (
      <YStack
        flex={1}
        padding='$6'
        gap='$6'
        alignItems='center'
        justifyContent='center'
      >
        <InfoCard variant='error'>
          <XStack gap='$2' alignItems='center'>
            <ShieldOff size={16} />
            <InfoCardText variant='error'>
              Je hebt geen toegang tot deze pagina
            </InfoCardText>
          </XStack>
        </InfoCard>
      </YStack>
    )
  }
  return <>{children}</>
}
