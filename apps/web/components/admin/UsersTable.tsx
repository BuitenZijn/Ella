'use client'

import type { Id } from '@ella/backend/dataModel'
import type { User } from '@ella/backend/types'
import {
  Table,
  TableHead,
  TableHeadRow,
  TableHeadCell,
  TableHeadText,
  TableBody,
  TableRow,
  TableCell,
  TableEmptyState,
  TableScroll,
  XStack,
  YStack,
  Text,
  Badge,
  BadgeText,
  IconButton,
  neutralColors,
  brandColors,
  semanticColors,
} from '@ella/ui'
import { RoleBadge } from '../common'
import type { RoleType } from '../common'
import {
  Trash2,
  Shield,
  User as UserIcon,
  Check,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { PermissionOverridesEditor } from './PermissionOverridesEditor'
import { Fragment, useState } from 'react'
import { formatDate } from '@/lib/formatDate'

const AVAILABLE_ROLES: { value: RoleType; label: string }[] = [
  { value: 'user', label: 'Lid' },
  { value: 'admin', label: 'Admin' },
]

export interface UsersTableProps {
  users: User[] | undefined
  currentUserId: string | undefined
  /** With users:manage: change roles and permissions, and delete users */
  canManage: boolean
  onRoleChange: (
    userId: Id<'users'>,
    userName: string,
    newRole: RoleType,
  ) => void
  onDelete: (userId: Id<'users'>, userName: string) => void
}

function RoleSelect({
  currentRole,
  userName,
  onChange,
}: {
  currentRole: RoleType
  userName: string
  onChange: (role: RoleType) => void
}) {
  return (
    <select
      value={currentRole}
      aria-label={`Rol van ${userName}`}
      // The row toggles the permissions panel; choosing a role must not
      onClick={e => e.stopPropagation()}
      onChange={e => onChange(e.target.value as RoleType)}
      style={{
        backgroundColor: neutralColors.background.hover,
        color: neutralColors.text.primary,
        border: `1px solid ${neutralColors.border.subtle}`,
        borderRadius: 6,
        padding: '4px 8px',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        outline: 'none',
        width: '100%',
      }}
    >
      {AVAILABLE_ROLES.map(role => (
        <option key={role.value} value={role.value}>
          {role.label}
        </option>
      ))}
    </select>
  )
}

interface UserActionsCellProps {
  user: User
  currentUserId: string | undefined
  onRoleChange: (
    userId: Id<'users'>,
    userName: string,
    newRole: RoleType,
  ) => void
  onDelete: (userId: Id<'users'>, userName: string) => void
}

function UserActionsCell({
  user,
  currentUserId,
  onDelete,
}: UserActionsCellProps) {
  const isCurrentUser = currentUserId === user._id
  const fullName =
    [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Zonder naam'
  const userName = fullName !== 'Zonder naam' ? fullName : 'deze gebruiker'
  const userId = user._id as Id<'users'>

  if (isCurrentUser) {
    return (
      <Text color={neutralColors.text.muted} fontSize={13}>
        (You)
      </Text>
    )
  }

  return (
    <XStack gap='$3' alignItems='center'>
      <IconButton
        size='$2'
        chromeless
        aria-label={`${userName} verwijderen`}
        onPress={e => {
          e.stopPropagation()
          onDelete(userId, userName)
        }}
      >
        <Trash2 size={18} color={brandColors.destructive} />
      </IconButton>
    </XStack>
  )
}

export function UsersTable({
  users,
  currentUserId,
  canManage,
  onRoleChange,
  onDelete,
}: UsersTableProps) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)

  if (!users) {
    return (
      <Table>
        <TableEmptyState>
          <Text color={neutralColors.text.muted}>Gebruikers laden…</Text>
        </TableEmptyState>
      </Table>
    )
  }

  if (users.length === 0) {
    return (
      <Table>
        <TableEmptyState>
          <Text color={neutralColors.text.muted}>
            Geen gebruikers gevonden.
          </Text>
        </TableEmptyState>
      </Table>
    )
  }

  return (
    <YStack gap='$4'>
      <Text fontSize={18} fontWeight='600' color={neutralColors.text.primary}>
        Alle gebruikers ({users.length})
      </Text>
      <Table>
        {/* Scrolls sideways on narrow screens instead of clipping Actions */}
        <TableScroll>
          <YStack minWidth={880}>
            <TableHead>
              <TableHeadRow>
                <TableHeadCell width={40}>
                  <TableHeadText></TableHeadText>
                </TableHeadCell>
                <TableHeadCell flex={1} minWidth={150}>
                  <TableHeadText>Naam</TableHeadText>
                </TableHeadCell>
                <TableHeadCell flex={1} minWidth={180}>
                  <TableHeadText>E-mailadres</TableHeadText>
                </TableHeadCell>
                <TableHeadCell width={120}>
                  <TableHeadText>Rol</TableHeadText>
                </TableHeadCell>
                <TableHeadCell width={120}>
                  <TableHeadText>Aangemaakt</TableHeadText>
                </TableHeadCell>
                <TableHeadCell width={120}>
                  <TableHeadText>Status</TableHeadText>
                </TableHeadCell>
                <TableHeadCell width={80}>
                  <TableHeadText>Acties</TableHeadText>
                </TableHeadCell>
              </TableHeadRow>
            </TableHead>
            <TableBody>
              {users.map(user => {
                const isCurrentUser = currentUserId === user._id
                // Only managers see and edit other users' permission overrides
                const canExpand = canManage && !isCurrentUser
                const isExpanded = canExpand && expandedUserId === user._id
                const fullName =
                  [user.firstName, user.lastName].filter(Boolean).join(' ') ||
                  'Zonder naam'
                const userName =
                  fullName !== 'Zonder naam' ? fullName : 'deze gebruiker'
                const toggleExpanded = () =>
                  setExpandedUserId(isExpanded ? null : user._id)

                return (
                  <Fragment key={user._id}>
                    <TableRow
                      interactive={canExpand}
                      onPress={canExpand ? toggleExpanded : undefined}
                    >
                      <TableCell width={40}>
                        {user.role === 'admin' ? (
                          <Shield
                            size={18}
                            color={semanticColors.warning.main}
                          />
                        ) : (
                          <UserIcon
                            size={18}
                            color={neutralColors.text.muted}
                          />
                        )}
                      </TableCell>
                      <TableCell flex={1} minWidth={150}>
                        <XStack gap='$2' alignItems='center'>
                          {canExpand && (
                            <IconButton
                              size='$1'
                              chromeless
                              aria-expanded={isExpanded}
                              aria-label={`Rechten van ${userName}`}
                              onPress={toggleExpanded}
                            >
                              {isExpanded ? (
                                <ChevronDown
                                  size={14}
                                  color={neutralColors.text.muted}
                                />
                              ) : (
                                <ChevronRight
                                  size={14}
                                  color={neutralColors.text.muted}
                                />
                              )}
                            </IconButton>
                          )}
                          <YStack gap='$1'>
                            <Text
                              color={neutralColors.text.primary}
                              fontWeight='500'
                              fontSize={14}
                            >
                              {fullName}
                            </Text>
                            <Text
                              color={neutralColors.text.muted}
                              fontSize={11}
                              fontFamily='$mono'
                            >
                              {user._id.substring(0, 12)}...
                            </Text>
                          </YStack>
                        </XStack>
                      </TableCell>
                      <TableCell flex={1} minWidth={180}>
                        <Text
                          color={neutralColors.text.secondary}
                          fontSize={14}
                          numberOfLines={1}
                        >
                          {user.email || 'Geen e-mailadres'}
                        </Text>
                      </TableCell>
                      <TableCell width={120}>
                        {isCurrentUser || !canManage ? (
                          <RoleBadge role={user.role} size='$3' />
                        ) : (
                          <RoleSelect
                            currentRole={(user.role as RoleType) ?? 'user'}
                            userName={userName}
                            onChange={newRole => {
                              onRoleChange(
                                user._id as Id<'users'>,
                                userName,
                                newRole,
                              )
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell width={120}>
                        <Text
                          color={neutralColors.text.secondary}
                          fontSize={13}
                        >
                          {formatDate(user._creationTime)}
                        </Text>
                      </TableCell>
                      <TableCell width={120}>
                        {isCurrentUser ? (
                          <Badge variant='success'>
                            <Check size={12} />
                            <BadgeText variant='success'>Jij</BadgeText>
                          </Badge>
                        ) : (
                          <Text color={neutralColors.text.muted} fontSize={13}>
                            Actief
                          </Text>
                        )}
                      </TableCell>
                      <TableCell width={80}>
                        {canManage && (
                          <UserActionsCell
                            user={user}
                            currentUserId={currentUserId}
                            onRoleChange={onRoleChange}
                            onDelete={onDelete}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${user._id}-perms`}>
                        <TableCell>
                          <PermissionOverridesEditor
                            userId={user._id as Id<'users'>}
                            currentOverrides={
                              (
                                user as unknown as {
                                  permissionOverrides?: string[]
                                }
                              ).permissionOverrides ?? []
                            }
                            userRole={user.role ?? 'user'}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </YStack>
        </TableScroll>
      </Table>
    </YStack>
  )
}
