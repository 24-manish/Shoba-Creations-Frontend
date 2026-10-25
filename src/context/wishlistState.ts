import { createContext } from 'react'
import type { Product } from '../types/api'

export interface WishlistContextValue {
  productIds: string[]
  count: number
  /** The saved pieces, resolved for display. */
  products: Product[]
  isLoading: boolean
  error: string | null
  isWishlisted: (productId: string) => boolean
  toggleWishlist: (productId: string) => void
  clearWishlist: () => void
}

export const WishlistContext = createContext<WishlistContextValue | null>(null)
