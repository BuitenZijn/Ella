import {
  Baby,
  Home,
  Library,
  Settings,
  Shield,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'

/** One destination in the navbar, shared by the desktop menus and the drawer */
export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  /** Also active on the item's sub-pages */
  prefix?: boolean
}

/** Public pages, for everyone (the drawer lists them on small screens) */
export const PUBLIC_LINKS: NavItem[] = [
  { label: 'Home', href: '/', icon: Home },
]

/**
 * Member destinations. Each activity that is ported adds its entry here,
 * with the permission that gates it where it has one.
 */
export const MAIN_LINKS: (NavItem & { permission?: string })[] = [
  { label: 'Mijn kinderen', href: '/kinderen', icon: Baby },
  {
    label: 'Inhoud',
    href: '/inhoud',
    icon: Library,
    permission: 'content:manage',
  },
]

/** Everything under the Admin menu needs `admin:dashboard` */
export const ADMIN_LINKS: NavItem[] = [
  { label: 'Gebruikers', href: '/admin/users', icon: Users },
  { label: 'Rollen', href: '/admin/roles', icon: ShieldCheck },
]

export const ACCOUNT_LINKS: NavItem[] = [
  { label: 'Mijn account', href: '/user', icon: Settings },
  { label: 'Privacybeleid', href: '/privacy', icon: Shield },
]

export function isActive(item: NavItem, pathname: string) {
  return item.prefix
    ? pathname === item.href || pathname.startsWith(`${item.href}/`)
    : pathname === item.href
}
