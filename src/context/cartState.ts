import { createContext } from 'react'
import type { Product } from '../types/api'

/**
 * A bag line as the UI needs it: flat display fields rather than a nested
 * product. The server already sends a name, a price and an image on every cart
 * line, so embedding a whole `Product` would mean re-fetching the catalogue just
 * to draw a drawer.
 */
export interface CartViewLine {
  /** Stable across quantity changes, so React does not remount the row. */
  key: string
  productId: string
  slug: string
  name: string
  category: string | null
  quantity: number
  selectedColor: string | null
  selectedSize: string | null
  unitPrice: number
  compareAtPrice: number | null
  lineTotal: number
  imageUrl: string | null
  tone: string | null
  stock: number
}

export interface CartContextValue {
  items: CartViewLine[]
  cartCount: number
  subtotal: number
  isLoading: boolean
  /** True when the bag is still only a local set of identifiers. */
  isGuest: boolean
  error: string | null
  addItem: (product: Product, quantity?: number, selectedColor?: string | null, selectedSize?: string | null) => void
  updateQuantity: (productId: string, quantity: number, selectedColor?: string | null, selectedSize?: string | null) => void
  removeItem: (productId: string, selectedColor?: string | null, selectedSize?: string | null) => void
  clearCart: () => void
}

export const CartContext = createContext<CartContextValue | null>(null)
