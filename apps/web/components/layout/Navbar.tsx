'use client'

import {
  XStack,
  YStack,
  Paragraph,
  Text,
  Button,
  Popover,
  Separator,
  brandColors,
  neutralColors,
} from '@ella/ui'
import { usePathname, useRouter } from 'next/navigation'
import { Authenticated, Unauthenticated, useQuery } from 'convex/react'
import { api } from '@ella/backend/api'
import Link from 'next/link'
import { ChevronDown, LogOut, Crown, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavbar } from './NavbarContext'
import {
  ACCOUNT_LINKS,
  ADMIN_LINKS,
  MAIN_LINKS,
  isActive,
  type NavItem,
} from './navItems'
import { Wordmark } from '../brand/Wordmark'
import { NavbarDrawer, UserAvatar } from './NavbarDrawer'
import { usePermissions } from '../../hooks/usePermissions'
import { ButtonLink } from '@/components/common/ButtonLink'

/** A row in a dropdown menu that navigates and closes the menu */
function MenuButton({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem
  pathname: string
  onNavigate: (href: string) => void
}) {
  const Icon = item.icon
  return (
    <Button
      size='$3'
      backgroundColor='transparent'
      borderWidth={0}
      justifyContent='flex-start'
      hoverStyle={{ backgroundColor: neutralColors.background.hover }}
      onPress={() => onNavigate(item.href)}
    >
      <XStack gap='$2' alignItems='center'>
        <Icon size={16} color={neutralColors.text.primary} aria-hidden />
        <Text
          weight={isActive(item, pathname) ? 'semibold' : 'medium'}
          color={neutralColors.text.primary}
        >
          {item.label}
        </Text>
      </XStack>
    </Button>
  )
}

function NavTextLink({
  href,
  label,
  active,
}: {
  href: string
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      style={{ textDecoration: 'none' }}
    >
      <Paragraph
        fontSize={15}
        fontWeight={active ? '600' : '500'}
        color={active ? brandColors.primary : neutralColors.text.secondary}
        hoverStyle={{
          color: active ? brandColors.primary : neutralColors.text.primary,
        }}
        pressStyle={{ opacity: 0.7 }}
        paddingHorizontal='$3'
        paddingVertical='$2'
        cursor='pointer'
        position='relative'
        style={{
          transition: 'color 0.2s ease',
          borderBottom: active
            ? `2px solid ${brandColors.primary}`
            : '2px solid transparent',
        }}
      >
        {label}
      </Paragraph>
    </Link>
  )
}

/**
 * App navbar. Above `$md` (1020px) it shows the links and dropdown menus in
 * one row; below, signed-in users get a menu button that opens a drawer with
 * the same links, so the account menu and sign-out fit on a phone or tablet.
 *
 * With every menu (logo, section label, three links, Admin, account) the
 * row is about 1100px, and it overflowed between 800 and 1000px. Up to `$lg`
 * (1280px) the decorative section label is dropped, which brings it to about
 * 960px, and the account name is capped so a long email address can't push
 * the row off screen.
 */
export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [adminOpen, setAdminOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const currentUserData = useQuery(api.functions.users.me)
  const currentUser = currentUserData?.user
  const { hasPermission } = usePermissions()
  const { isVisible } = useNavbar()

  // Hide navbar when in editor mode
  if (!isVisible) {
    return null
  }

  const mainLinks = MAIN_LINKS.filter(
    item => !item.permission || hasPermission(item.permission),
  )
  const isAdmin = hasPermission('admin:dashboard')
  const displayName =
    [currentUser?.firstName].filter(Boolean).join(' ') || currentUser?.email
  const initial =
    currentUser?.firstName?.charAt(0).toUpperCase() ||
    currentUser?.email?.charAt(0).toUpperCase() ||
    'U'

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
      <XStack alignItems='center' gap='$8'>
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
        {pathname.startsWith('/admin') && (
          <XStack alignItems='center' gap='$2' $lg={{ display: 'none' }}>
            <ShieldCheck size={20} color={brandColors.primary} aria-hidden />
            <Paragraph
              fontSize={20}
              fontWeight='700'
              color={neutralColors.text.primary}
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Admin
            </Paragraph>
          </XStack>
        )}
      </XStack>

      <XStack alignItems='center' gap='$3'>
        <XStack $md={{ display: 'none' }}>
          <NavTextLink href='/' label='Home' active={pathname === '/'} />
        </XStack>

        <Authenticated>
          {/* Wide screens: links and dropdown menus in one row */}
          <XStack alignItems='center' gap='$3' $md={{ display: 'none' }}>
            {mainLinks.map(item => (
              <NavTextLink
                key={item.href}
                href={item.href}
                label={item.label}
                active={pathname === item.href}
              />
            ))}

            {isAdmin && (
              <Popover open={adminOpen} onOpenChange={setAdminOpen}>
                <Popover.Trigger asChild>
                  <Button
                    size='$3'
                    backgroundColor='transparent'
                    borderWidth={0}
                    hoverStyle={{
                      backgroundColor: neutralColors.background.hover,
                    }}
                    pressStyle={{ opacity: 0.7 }}
                  >
                    <XStack gap='$2' alignItems='center'>
                      <Paragraph
                        fontSize={15}
                        fontWeight={
                          pathname.startsWith('/admin') ? '600' : '500'
                        }
                        color={
                          pathname.startsWith('/admin')
                            ? brandColors.primary
                            : neutralColors.text.secondary
                        }
                      >
                        Admin
                      </Paragraph>
                      <ChevronDown
                        size={16}
                        aria-hidden
                        color={
                          pathname.startsWith('/admin')
                            ? brandColors.primary
                            : neutralColors.text.secondary
                        }
                      />
                    </XStack>
                  </Button>
                </Popover.Trigger>

                <Popover.Content
                  borderWidth={1}
                  borderColor={neutralColors.border.default}
                  backgroundColor={neutralColors.background.elevated}
                  enterStyle={{ y: -10, opacity: 0 }}
                  exitStyle={{ y: -10, opacity: 0 }}
                >
                  <YStack gap='$2' minWidth={180}>
                    {ADMIN_LINKS.map(item => (
                      <MenuButton
                        key={item.href}
                        item={item}
                        pathname={pathname}
                        onNavigate={href => {
                          router.push(href)
                          setAdminOpen(false)
                        }}
                      />
                    ))}
                  </YStack>
                </Popover.Content>
              </Popover>
            )}

            {/* User Menu Dropdown */}
            <YStack
              width={1}
              height={24}
              backgroundColor={neutralColors.border.default}
              marginHorizontal='$2'
            />

            <Popover open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <Popover.Trigger asChild>
                <Button
                  size='$3'
                  backgroundColor='transparent'
                  borderWidth={1}
                  borderColor={neutralColors.border.default}
                  hoverStyle={{
                    backgroundColor: neutralColors.background.hover,
                  }}
                  pressStyle={{ opacity: 0.7 }}
                >
                  <XStack gap='$2' alignItems='center'>
                    <UserAvatar
                      imageUrl={currentUserData?.imageUrl}
                      initial={initial}
                    />
                    <Text
                      variant='muted'
                      color={neutralColors.text.secondary}
                      numberOfLines={1}
                      maxWidth={160}
                    >
                      {displayName}
                    </Text>
                    <ChevronDown
                      size={16}
                      color={neutralColors.text.secondary}
                      aria-hidden
                    />
                  </XStack>
                </Button>
              </Popover.Trigger>

              <Popover.Content
                borderWidth={1}
                borderColor={neutralColors.border.default}
                backgroundColor={neutralColors.background.elevated}
                enterStyle={{ y: -10, opacity: 0 }}
                exitStyle={{ y: -10, opacity: 0 }}
              >
                <YStack gap='$1' minWidth={220}>
                  {/* User Info Section */}
                  <YStack padding='$3' gap='$1'>
                    <Text
                      size='$5'
                      weight='semibold'
                      color={neutralColors.text.primary}
                    >
                      {[currentUser?.firstName].filter(Boolean).join(' ') ||
                        'Lid'}
                    </Text>
                    <Text
                      variant='muted'
                      size='$3'
                      color={neutralColors.text.secondary}
                    >
                      {currentUser?.email}
                    </Text>
                    {isAdmin && (
                      <XStack marginTop='$1'>
                        <XStack alignItems='center' gap='$1'>
                          <Crown
                            size={12}
                            color={brandColors.primary}
                            aria-hidden
                          />
                          <Text
                            size='$1'
                            weight='semibold'
                            color={brandColors.primary}
                            backgroundColor={brandColors.primaryLight}
                            paddingHorizontal='$2'
                            paddingVertical='$1'
                            borderRadius='$2'
                          >
                            Admin
                          </Text>
                        </XStack>
                      </XStack>
                    )}
                  </YStack>

                  <Separator backgroundColor={neutralColors.border.default} />

                  {ACCOUNT_LINKS.map(item => (
                    <MenuButton
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      onNavigate={href => {
                        router.push(href)
                        setUserMenuOpen(false)
                      }}
                    />
                  ))}

                  <Separator backgroundColor={neutralColors.border.default} />

                  {/* Afmelden */}
                  <Button
                    size='$3'
                    backgroundColor='transparent'
                    borderWidth={0}
                    justifyContent='flex-start'
                    hoverStyle={{
                      backgroundColor: brandColors.destructiveLight,
                    }}
                    onPress={() => {
                      setUserMenuOpen(false)
                      // The dedicated page unloads authenticated queries
                      // before tearing down the session.
                      router.push('/sign-out')
                    }}
                  >
                    <XStack gap='$2' alignItems='center'>
                      <LogOut
                        size={16}
                        color={brandColors.destructive}
                        aria-hidden
                      />
                      <Text color={brandColors.destructive}>Afmelden</Text>
                    </XStack>
                  </Button>
                </YStack>
              </Popover.Content>
            </Popover>
          </XStack>

          {/* Phones and tablets: one menu button that opens a drawer */}
          <XStack display='none' $md={{ display: 'flex' }}>
            <NavbarDrawer
              pathname={pathname}
              mainLinks={mainLinks}
              isAdmin={isAdmin}
              displayName={displayName}
              email={currentUser?.email}
              imageUrl={currentUserData?.imageUrl}
              initial={initial}
            />
          </XStack>
        </Authenticated>

        <Unauthenticated>
          <ButtonLink href='/sign-in' size='sm'>
            Aanmelden
          </ButtonLink>
        </Unauthenticated>
      </XStack>
    </XStack>
  )
}
