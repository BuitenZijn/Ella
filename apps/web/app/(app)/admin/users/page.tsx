'use client'

import { YStack, Button, ButtonText } from '@ella/ui'
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react'
import { api } from '@ella/backend/api'
import type { Id } from '@ella/backend/dataModel'
import { useState } from 'react'
import {
  PageHeader,
  ConfirmDialog,
  ConfirmDialogProps,
} from '@/components/common'
import type { RoleType } from '@/components/common'
import { UsersTable, CurrentUserCard, PermissionGate } from '@/components/admin'
import { usePermissions } from '@/hooks/usePermissions'

const roleLabels: Record<RoleType, string> = {
  admin: 'Admin',
  user: 'Lid',
}

export default function UsersAdminPage() {
  // The list needs users:view-all; changing users needs users:manage too
  return (
    <PermissionGate permission='users:view-all'>
      <UsersAdmin />
    </PermissionGate>
  )
}

function UsersAdmin() {
  const { hasPermission } = usePermissions()
  const canManageUsers = hasPermission('users:manage')
  const {
    results: allUsers,
    status: usersStatus,
    loadMore,
  } = usePaginatedQuery(
    api.functions.users.listPaginated,
    {},
    { initialNumItems: 50 },
  )
  const deleteUser = useMutation(api.functions.users.remove)
  const updateUserRole = useMutation(api.functions.users.updateRole)
  const currentUserData = useQuery(api.functions.users.me)
  const currentUserProfile = currentUserData?.user

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [dialogProps, setDialogProps] = useState<Omit<
    ConfirmDialogProps,
    'open' | 'onOpenChange'
  > | null>(null)

  const handleDelete = (userId: Id<'users'>, userName: string) => {
    setDialogProps({
      title: 'Gebruiker verwijderen',
      description: (
        <>
          Dit kan niet ongedaan gemaakt worden. Dit verwijdert definitief{' '}
          <strong>{userName}</strong>.
        </>
      ),
      confirmText: 'DELETE',
      confirmLabel: 'Gebruiker verwijderen',
      variant: 'danger',
      onConfirm: async () => {
        await deleteUser({ id: userId })
      },
    })
    setConfirmOpen(true)
  }

  const handleRoleChange = (
    userId: Id<'users'>,
    userName: string,
    newRole: RoleType,
  ) => {
    const isPromotingToAdmin = newRole === 'admin'
    setDialogProps({
      title: `Rol wijzigen naar ${roleLabels[newRole]}`,
      description: (
        <>
          Je staat op het punt de rol van <strong>{userName}</strong>te wijzigen
          naar <strong>{roleLabels[newRole]}</strong>.
          {isPromotingToAdmin &&
            ' Die persoon krijgt volledige toegang tot alle beheerfuncties.'}
        </>
      ),
      confirmText: 'CONFIRM',
      confirmLabel: `Maak ${roleLabels[newRole]}`,
      variant: isPromotingToAdmin ? 'warning' : 'success',
      onConfirm: async () => {
        await updateUserRole({ userId, role: newRole })
      },
    })
    setConfirmOpen(true)
  }

  return (
    <YStack flex={1} padding='$6' gap='$6'>
      <PageHeader
        title='Gebruikers'
        description={
          canManageUsers
            ? 'Bekijk en beheer alle gebruikers'
            : 'Bekijk alle gebruikers'
        }
      />

      {currentUserProfile && (
        <CurrentUserCard
          name={
            [currentUserProfile.firstName, currentUserProfile.lastName]
              .filter(Boolean)
              .join(' ') || 'Onbekend'
          }
          email={currentUserProfile.email || ''}
          role={currentUserProfile.role}
        />
      )}

      <UsersTable
        users={usersStatus === 'LoadingFirstPage' ? undefined : allUsers}
        currentUserId={currentUserProfile?._id}
        canManage={canManageUsers}
        onRoleChange={handleRoleChange}
        onDelete={handleDelete}
      />

      {(usersStatus === 'CanLoadMore' || usersStatus === 'LoadingMore') && (
        <Button
          alignSelf='center'
          variant='outline'
          disabled={usersStatus === 'LoadingMore'}
          onPress={() => loadMore(50)}
        >
          <ButtonText>
            {usersStatus === 'LoadingMore' ? 'Laden…' : 'Meer gebruikers laden'}
          </ButtonText>
        </Button>
      )}

      {dialogProps && (
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          {...dialogProps}
        />
      )}
    </YStack>
  )
}
