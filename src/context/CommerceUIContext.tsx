import { useMemo, useState, type PropsWithChildren } from 'react'
import { CommerceUIContext, type CommerceUIContextValue } from './commerceUIState'

export function CommerceUIProvider({ children }: PropsWithChildren) {
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const value = useMemo<CommerceUIContextValue>(
    () => ({
      isCartOpen,
      isSearchOpen,
      isMenuOpen,
      openCart: () => setIsCartOpen(true),
      closeCart: () => setIsCartOpen(false),
      openSearch: () => setIsSearchOpen(true),
      closeSearch: () => setIsSearchOpen(false),
      openMenu: () => setIsMenuOpen(true),
      closeMenu: () => setIsMenuOpen(false),
    }),
    [isCartOpen, isMenuOpen, isSearchOpen],
  )

  return <CommerceUIContext.Provider value={value}>{children}</CommerceUIContext.Provider>
}
