'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'

interface NavbarContextType {
  isVisible: boolean
  hide: () => void
  show: () => void
}

const NavbarContext = createContext<NavbarContextType | undefined>(undefined)

export function NavbarProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(true)

  const hide = useCallback(() => setIsVisible(false), [])
  const show = useCallback(() => setIsVisible(true), [])

  return (
    <NavbarContext.Provider value={{ isVisible, hide, show }}>
      {children}
    </NavbarContext.Provider>
  )
}

export function useNavbar() {
  const context = useContext(NavbarContext)
  if (context === undefined) {
    throw new Error('useNavbar must be used within a NavbarProvider')
  }
  return context
}
