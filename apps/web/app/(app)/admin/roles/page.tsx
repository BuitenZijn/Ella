'use client'

import { YStack, Text, Card, neutralColors } from '@ella/ui'
import { Fragment } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@ella/backend/api'
import { PageHeader } from '@/components/common'
import { Check, Minus } from 'lucide-react'
import { PermissionGate } from '@/components/admin'

const ROLE_LABELS: Record<string, string> = {
  user: 'Lid',
  admin: 'Admin',
}

const ROLE_ORDER = ['user', 'admin']

export default function RolesPage() {
  return (
    <PermissionGate permission='admin:view-roles'>
      <RolesMatrix />
    </PermissionGate>
  )
}

function RolesMatrix() {
  const config = useQuery(api.functions.admin.getPermissionsConfig)

  if (!config) {
    return (
      <YStack flex={1} padding='$6' gap='$6'>
        <PageHeader
          title='Rollen en rechten'
          description='Welke rechten elke rol geeft'
        />
        <Text color={neutralColors.text.muted}>Laden…</Text>
      </YStack>
    )
  }

  const domains = Object.entries(config.permissions)
  const roles = ROLE_ORDER.filter(r => r in config.rolePermissions)

  return (
    <YStack flex={1} padding='$6' gap='$6'>
      <PageHeader
        title='Rollen en rechten'
        description='Welke rechten elke rol geeft (alleen lezen — de rollen staan in de code)'
      />

      <Card padding='$4' overflow='hidden'>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    borderBottom: `2px solid var(--borderColor)`,
                    color: 'var(--color11)',
                    fontWeight: 600,
                    fontSize: 12,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Recht
                </th>
                {roles.map(role => (
                  <th
                    key={role}
                    style={{
                      textAlign: 'center',
                      padding: '8px 16px',
                      borderBottom: `2px solid var(--borderColor)`,
                      color: 'var(--color12)',
                      fontWeight: 600,
                      fontSize: 13,
                      minWidth: 90,
                    }}
                  >
                    {ROLE_LABELS[role] ?? role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {domains.map(([domain, perms]) => (
                <Fragment key={domain}>
                  <tr>
                    <td
                      colSpan={roles.length + 1}
                      style={{
                        padding: '12px 12px 4px',
                        fontWeight: 700,
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--brand)',
                        borderTop: `1px solid var(--borderColor)`,
                      }}
                    >
                      {domain.replace(/_/g, ' ')}
                    </td>
                  </tr>
                  {perms.map(perm => (
                    <tr key={perm}>
                      <td
                        style={{
                          padding: '6px 12px 6px 24px',
                          color: 'var(--color12)',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontSize: 12,
                        }}
                      >
                        {perm}
                      </td>
                      {roles.map(role => {
                        const rolePerms = config.rolePermissions[role] ?? []
                        const has = rolePerms.includes(perm)
                        return (
                          <td
                            key={role}
                            style={{
                              textAlign: 'center',
                              padding: '6px 16px',
                            }}
                          >
                            {has ? (
                              <Check size={16} color='var(--color12)' />
                            ) : (
                              <Minus size={16} color='var(--borderColor)' />
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card padding='$4'>
        <YStack gap='$2'>
          <Text fontSize={13} fontWeight='600' color='$color12'>
            Hoe het werkt
          </Text>
          <Text fontSize={13} color='$color11'>
            Elke gebruiker heeft een rol (lid of admin) die een reeks rechten
            geeft. Admins kunnen op de pagina Gebruikers ook extra rechten per
            persoon toekennen, bovenop wat de rol geeft.
          </Text>
        </YStack>
      </Card>
    </YStack>
  )
}
