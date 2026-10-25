import { createContext } from 'react'

export interface CommerceUIContextValue {
  isCartOpen: boolean
  isSearchOpen: boolean
  isMenuOpen: boolean
  openCart: () => void
  closeCart: () => void
  openSearch: () => void
  closeSearch: () => void
  openMenu: () => void
  closeMenu: () => void
}

export const CommerceUIContext = createContext<CommerceUIContextValue | null>(null)
