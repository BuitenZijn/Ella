'use client'

import Link from 'next/link'
import { XStack, YStack, Separator, LinkText, Text } from '@ella/ui'

interface AuthFlowToggleProps {
  message: string
  linkText: string
  linkHref: string
  showForgotPassword?: boolean
  forgotPasswordHref?: string
}

export function AuthFlowToggle({
  message,
  linkText,
  linkHref,
  showForgotPassword = false,
  forgotPasswordHref = '/reset-password',
}: AuthFlowToggleProps) {
  return (
    <YStack gap='$4'>
      {/* Divider */}
      <XStack gap='$3' alignItems='center'>
        <Separator />
        <Text
          size='$2'
          color='$color10'
          textTransform='uppercase'
          weight='normal'
        >
          Of
        </Text>
        <Separator />
      </XStack>

      {/* Registreren link */}
      <XStack justifyContent='center' gap='$2'>
        <Text size='$4' color='$color11'>
          {message}
        </Text>
        <Link href={linkHref} style={{ textDecoration: 'none' }}>
          <LinkText>{linkText}</LinkText>
        </Link>
      </XStack>

      {/* Forgot password link */}
      {showForgotPassword && (
        <XStack justifyContent='center'>
          <Link href={forgotPasswordHref} style={{ textDecoration: 'none' }}>
            <LinkText>Wachtwoord vergeten?</LinkText>
          </Link>
        </XStack>
      )}
    </YStack>
  )
}
