import { useContext } from 'react'
import { CommerceUIContext } from './commerceUIState'

export function useCommerceUI() {
  const context = useContext(CommerceUIContext)

  if (!context) {
    throw new Error('useCommerceUI must be used inside CommerceUIProvider')
  }

  return context
}
