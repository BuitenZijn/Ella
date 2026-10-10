'use client'

import { StatCard as StatCardBase, StatLabel, StatValue } from '@ella/ui'

export type StatVariant = 'primary' | 'success' | 'warning' | 'error' | 'info'

export interface StatCardProps {
  title: string
  value: string | number
  /** @deprecated Use `variant` instead for type-safe color control */
  color?: string
  variant?: StatVariant
  loading?: boolean
  minWidth?: number
}

export function StatCard({
  title,
  value,
  variant = 'primary',
  loading = false,
  minWidth = 150,
}: StatCardProps) {
  return (
    <StatCardBase variant={variant} flex={1} minWidth={minWidth}>
      <StatLabel>{title}</StatLabel>
      <StatValue variant={variant}>{loading ? '...' : value}</StatValue>
    </StatCardBase>
  )
}
