'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  XStack,
  YStack,
  Text,
  Button,
  Dialog,
  Separator,
  Avatar,
  AvatarText,
  brandColors,
  neutralColors,
} from '@ella/ui'
import { LogOut, Menu, X } from 'lucide-react'
import {
  ACCOUNT_LINKS,
  ADMIN_LINKS,
  PUBLIC_LINKS,
  isActive,
  type NavItem,
} from './navItems'

const SIGN_OUT_LINK: NavItem = {
  label: 'Afmelden',
  href: '/sign-out',
  icon: LogOut,
}

export function UserAvatar({
  imageUrl,
  initial,
}: {
  imageUrl?: string | null
  initial: string
}) {
  return (
    <Avatar variant='primary' size='$3'>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=''
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%',
          }}
        />
      ) : (
        <AvatarText size='$3'>{initial}</AvatarText>
      )}
    </Avatar>
  )
}

/** A full-width link row in the drawer */
function DrawerLink({
  item,
  pathname,
  onNavigate,
  color = neutralColors.text.primary,
}: {
  item: NavItem
  pathname: string
  onNavigate: () => void
  color?: string
}) {
  const Icon = item.icon
  const active = isActive(item, pathname)
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      style={{ textDecoration: 'none' }}
    >
      <XStack
        gap='$3'
        alignItems='center'
        paddingHorizontal='$3'
        paddingVertical='$2.5'
        borderRadius='$3'
        backgroundColor={active ? brandColors.primaryLight : 'transparent'}
        hoverStyle={{ backgroundColor: neutralColors.background.hover }}
      >
        <Icon
          size={18}
          color={active ? brandColors.primary : color}
          aria-hidden
        />
        <Text
          size='$4'
          weight={active ? 'semibold' : 'medium'}
          color={active ? brandColors.primary : color}
        >
          {item.label}
        </Text>
      </XStack>
    </Link>
  )
}

function DrawerHeading({ children }: { children: string }) {
  return (
    <Text
      size='$1'
      weight='semibold'
      color={neutralColors.text.muted}
      textTransform='uppercase'
      letterSpacing={1}
      paddingHorizontal='$3'
      paddingTop='$3'
      paddingBottom='$1'
    >
      {children}
    </Text>
  )
}

export interface NavbarDrawerProps {
  pathname: string
  /** The main links this user may open */
  mainLinks: NavItem[]
  isAdmin: boolean
  displayName?: string
  /** Shown under the name when the name isn't the email itself */
  email?: string
  imageUrl?: string | null
  initial: string
}

/**
 * The signed-in navbar below `$md` (1020px): a menu button that opens a
 * drawer with the main links, the admin pages, account settings, the legal
 * pages and sign-out. The desktop row needs about 960px even without the
 * section label, so it doesn't fit there.
 */
export function NavbarDrawer({
  pathname,
  mainLinks,
  isAdmin,
  displayName,
  email,
  imageUrl,
  initial,
}: NavbarDrawerProps) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Dialog modal open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          size='$3'
          backgroundColor='transparent'
          borderWidth={1}
          borderColor={neutralColors.border.default}
          hoverStyle={{ backgroundColor: neutralColors.background.hover }}
          aria-label='Menu openen'
        >
          <XStack gap='$2' alignItems='center'>
            <UserAvatar imageUrl={imageUrl} initial={initial} />
            <Menu size={20} color={neutralColors.text.primary} aria-hidden />
          </XStack>
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal justifyContent='flex-start' alignItems='flex-end'>
        <Dialog.Overlay
          key='overlay'
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          key='content'
          width='100%'
          maxWidth={340}
          height='100%'
          borderRadius={0}
          padding='$3'
          gap='$1'
          overflowY='auto'
          backgroundColor={neutralColors.background.elevated}
          borderLeftWidth={1}
          borderColor={neutralColors.border.default}
          enterStyle={{ x: 40, opacity: 0 }}
          exitStyle={{ x: 40, opacity: 0 }}
        >
          <XStack
            alignItems='center'
            justifyContent='space-between'
            gap='$3'
            paddingHorizontal='$3'
            paddingVertical='$2'
          >
            <XStack alignItems='center' gap='$3' flex={1} minWidth={0}>
              <UserAvatar imageUrl={imageUrl} initial={initial} />
              <YStack flex={1} minWidth={0}>
                <Dialog.Title
                  fontSize={16}
                  lineHeight={22}
                  fontWeight='600'
                  color={neutralColors.text.primary}
                  numberOfLines={1}
                >
                  {displayName || 'Menu'}
                </Dialog.Title>
                {email && email !== displayName && (
                  <Text
                    size='$2'
                    color={neutralColors.text.secondary}
                    numberOfLines={1}
                  >
                    {email}
                  </Text>
                )}
              </YStack>
            </XStack>
            <Dialog.Close asChild>
              <Button
                size='$3'
                circular
                backgroundColor='transparent'
                borderWidth={0}
                hoverStyle={{ backgroundColor: neutralColors.background.hover }}
                aria-label='Menu sluiten'
              >
                <X size={20} color={neutralColors.text.primary} aria-hidden />
              </Button>
            </Dialog.Close>
          </XStack>

          <Separator borderColor={neutralColors.border.default} />

          <YStack render='nav' aria-label='Hoofdmenu'>
            {[...PUBLIC_LINKS, ...mainLinks].map(item => (
              <DrawerLink
                key={item.href}
                item={item}
                pathname={pathname}
                onNavigate={close}
              />
            ))}
          </YStack>

          {isAdmin && (
            <YStack render='nav' aria-label='Admin'>
              <DrawerHeading>Admin</DrawerHeading>
              {ADMIN_LINKS.map(item => (
                <DrawerLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onNavigate={close}
                />
              ))}
            </YStack>
          )}

          <DrawerHeading>Account</DrawerHeading>
          {ACCOUNT_LINKS.map(item => (
            <DrawerLink
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={close}
            />
          ))}
          <DrawerLink
            item={SIGN_OUT_LINK}
            pathname={pathname}
            onNavigate={close}
            color={brandColors.destructive}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
