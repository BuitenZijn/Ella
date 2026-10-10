'use client'

import type { Id } from '@ella/backend/dataModel'
import {
  XStack,
  YStack,
  Text,
  Button,
  ButtonText,
  IconButton,
  neutralColors,
  brandColors,
  semanticColors,
  useToast,
} from '@ella/ui'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@ella/backend/api'
import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { getErrorMessage } from '@/lib/errorMessage'

interface PermissionOverridesEditorProps {
  userId: Id<'users'>
  currentOverrides: string[]
  userRole: string
}

export function PermissionOverridesEditor({
  userId,
  currentOverrides,
  userRole,
}: PermissionOverridesEditorProps) {
  const config = useQuery(api.functions.admin.getPermissionsConfig)
  const updateOverrides = useMutation(
    api.functions.users.updatePermissionOverrides,
  )
  const { error: toastError } = useToast()
  const [pending, setPending] = useState<string[] | null>(null)
  const [saving, setSaving] = useState(false)

  if (!config) return <Text color={neutralColors.text.muted}>Laden…</Text>

  const overrides = pending ?? currentOverrides
  const rolePerms = new Set(config.rolePermissions[userRole] ?? [])

  const togglePermission = (perm: string) => {
    const current = pending ?? currentOverrides
    if (current.includes(perm)) {
      setPending(current.filter(p => p !== perm))
    } else {
      setPending([...current, perm])
    }
  }

  const handleSave = async () => {
    if (!pending) return
    setSaving(true)
    try {
      await updateOverrides({ userId, permissionOverrides: pending })
      setPending(null)
    } catch (error) {
      // Refusals are coded: your own permissions, or ones you don't hold.
      // The changes stay pending, to fix or cancel.
      toastError(
        getErrorMessage(error, 'De rechten konden niet opgeslagen worden.'),
      )
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setPending(null)
  }

  const hasChanges = pending !== null

  return (
    <YStack gap='$3' padding='$3'>
      <XStack justifyContent='space-between' alignItems='center'>
        <Text fontSize={13} fontWeight='600' color={neutralColors.text.primary}>
          Extra rechten
        </Text>
        {hasChanges && (
          <XStack gap='$2'>
            <Button size='$2' variant='outline' onPress={handleReset}>
              <ButtonText>Annuleren</ButtonText>
            </Button>
            <Button
              size='$2'
              backgroundColor={brandColors.primary}
              onPress={handleSave}
              disabled={saving}
            >
              <ButtonText color='white'>
                {saving ? 'Opslaan…' : 'Opslaan'}
              </ButtonText>
            </Button>
          </XStack>
        )}
      </XStack>

      <Text fontSize={12} color={neutralColors.text.muted}>
        Zet extra rechten aan bovenop wat de rol geeft. Rechten die de rol al
        geeft, staan als inbegrepen aangeduid.
      </Text>

      {Object.entries(config.permissions).map(([domain, perms]) => (
        <YStack key={domain} gap='$1'>
          <Text
            fontSize={11}
            fontWeight='600'
            color={neutralColors.text.secondary}
            textTransform='uppercase'
          >
            {domain.replace(/_/g, ' ')}
          </Text>
          <XStack gap='$2' flexWrap='wrap'>
            {perms.map(perm => {
              const fromRole = rolePerms.has(perm)
              const isOverride = overrides.includes(perm)
              const isActive = fromRole || isOverride

              return (
                <Button
                  key={perm}
                  size='$2'
                  borderWidth={1}
                  borderColor={
                    isActive
                      ? fromRole
                        ? semanticColors.success.main
                        : brandColors.primary
                      : neutralColors.border.subtle
                  }
                  backgroundColor={
                    isActive
                      ? fromRole
                        ? semanticColors.success.background
                        : brandColors.primaryLight
                      : 'transparent'
                  }
                  opacity={fromRole ? 0.7 : 1}
                  onPress={() => {
                    if (!fromRole) togglePermission(perm)
                  }}
                  cursor={fromRole ? 'default' : 'pointer'}
                  paddingHorizontal='$2'
                  paddingVertical='$1'
                >
                  <XStack gap='$1' alignItems='center'>
                    {isActive && (
                      <Check
                        size={12}
                        color={
                          fromRole
                            ? semanticColors.success.main
                            : brandColors.primary
                        }
                      />
                    )}
                    <Text
                      fontSize={11}
                      color={
                        isActive
                          ? fromRole
                            ? semanticColors.success.main
                            : brandColors.primary
                          : neutralColors.text.secondary
                      }
                    >
                      {perm}
                    </Text>
                  </XStack>
                </Button>
              )
            })}
          </XStack>
        </YStack>
      ))}

      {overrides.length > 0 && (
        <XStack gap='$1' flexWrap='wrap' alignItems='center'>
          <Text fontSize={11} color={neutralColors.text.muted}>
            Overrides:
          </Text>
          {overrides.map(perm => (
            <XStack
              key={perm}
              backgroundColor={brandColors.primaryLight}
              paddingHorizontal='$2'
              paddingVertical={2}
              borderRadius='$2'
              gap='$1'
              alignItems='center'
            >
              <Text fontSize={11} color={brandColors.primary}>
                {perm}
              </Text>
              <IconButton
                size='$1'
                chromeless
                aria-label={`${perm} verwijderen`}
                onPress={() => togglePermission(perm)}
              >
                <X size={10} color={brandColors.primary} />
              </IconButton>
            </XStack>
          ))}
        </XStack>
      )}
    </YStack>
  )
}
