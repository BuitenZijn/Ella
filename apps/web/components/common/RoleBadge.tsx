'use client'

import { Badge, BadgeText } from '@ella/ui'
import { Crown, User } from 'lucide-react'

export type RoleType = 'admin' | 'user'

const roleConfig: Record<
  RoleType,
  { label: string; variant: 'purple' | 'info'; icon: typeof Crown }
> = {
  admin: { label: 'Admin', variant: 'purple', icon: Crown },
  user: { label: 'Lid', variant: 'info', icon: User },
}

export interface RoleBadgeProps {
  role?: RoleType | string
  size?: '$2' | '$3' | '$4'
}

export function RoleBadge({ role = 'user', size = '$3' }: RoleBadgeProps) {
  const config = roleConfig[(role as RoleType) ?? 'user'] ?? roleConfig.user
  const Icon = config.icon

  return (
    <Badge variant={config.variant} size={size}>
      <Icon size={12} />
      <BadgeText variant={config.variant} size={size}>
        {config.label}
      </BadgeText>
    </Badge>
  )
}
