'use client'

import { useEffect, useState } from 'react'
import { XStack, Paragraph, brandColors, neutralColors } from '@ella/ui'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ButtonLink } from '@/components/common/ButtonLink'
import { DEFAULT_APP_RETURN_PATH } from '@/lib/authRedirect'
import { hasStoredSession } from '@/lib/authStorage'
import { CONVEX_URL } from '@/lib/convexUrl'
import { PUBLIC_LINKS } from './navItems'
import { Wordmark } from '../brand/Wordmark'

/** Whether this browser holds a Convex session, read after hydration. */
function useHasStoredSession(): boolean {
  const [signedIn, setSignedIn] = useState(false)
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- storage is only readable after hydration
      setSignedIn(hasStoredSession(window.localStorage, CONVEX_URL))
    } catch {
      // Storage blocked: treat as signed out
    }
  }, [])
  return signedIn
}

/**
 * Auth-free navbar for the static `(marketing)` pages (home, contact,
 * privacy).
 *
 * It deliberately renders no Convex components, so these pages don't load
 * the Convex client. Signed-in visitors get "Mijn account" instead of
 * "Aanmelden", based on the session stored in the browser.
 */
export function MarketingNavbar() {
  const pathname = usePathname()
  const signedIn = useHasStoredSession()

  return (
    <XStack
      backgroundColor={neutralColors.background.elevated}
      paddingHorizontal='$6'
      paddingVertical='$1'
      borderBottomWidth={1}
      borderBottomColor={neutralColors.border.default}
      alignItems='center'
      justifyContent='space-between'
      position='sticky'
      top={0}
      zIndex={999}
      height={75}
      $sm={{ paddingHorizontal: '$4' }}
    >
      {/* Logo/Brand */}
      <Link
        href='/'
        style={{
          textDecoration: 'none',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Wordmark />
      </Link>

      <XStack alignItems='center' gap='$3'>
        {PUBLIC_LINKS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            style={{ textDecoration: 'none' }}
          >
            <Paragraph
              fontSize={15}
              fontWeight={pathname === item.href ? '600' : '500'}
              color={
                pathname === item.href
                  ? brandColors.primary
                  : neutralColors.text.secondary
              }
              hoverStyle={{
                color:
                  pathname === item.href
                    ? brandColors.primary
                    : neutralColors.text.primary,
              }}
              pressStyle={{ opacity: 0.7 }}
              paddingHorizontal='$3'
              paddingVertical='$2'
              cursor='pointer'
              position='relative'
              style={{
                transition: 'color 0.2s ease',
                borderBottom:
                  pathname === item.href
                    ? `2px solid ${brandColors.primary}`
                    : '2px solid transparent',
              }}
            >
              {item.label}
            </Paragraph>
          </Link>
        ))}

        {signedIn ? (
          <ButtonLink href={DEFAULT_APP_RETURN_PATH} size='sm'>
            Mijn account
          </ButtonLink>
        ) : (
          <ButtonLink href='/sign-in' size='sm'>
            Aanmelden
          </ButtonLink>
        )}
      </XStack>
    </XStack>
  )
}
