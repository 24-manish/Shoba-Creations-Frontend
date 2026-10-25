import { useMemo, type PropsWithChildren } from 'react'
import { useAuth } from './useAuth'
import { guestCart } from '../lib/guestStore'
import {
  useAddToCart,
  useCart,
  useClearCart,
  useGuestCartLines,
  useRemoveCartItem,
  useUpdateCartItem,
} from '../hooks/useCommerce'
import { CartContext, type CartContextValue, type CartViewLine } from './cartState'
import type { CartLine, Product } from '../types/api'

const lineKey = (productId: string, color: string | null, size: string | null) =>
  `${productId}::${color ?? ''}::${size ?? ''}`

/** The server's own cart line, flattened for display. */
const fromServerLine = (line: CartLine): CartViewLine => ({
  key: lineKey(line.productId, line.selectedColor, line.selectedSize),
  productId: line.productId,
  slug: line.slug,
  name: line.name,
  category: line.category,
  quantity: line.quantity,
  selectedColor: line.selectedColor,
  selectedSize: line.selectedSize,
  unitPrice: line.price,
  compareAtPrice: line.compareAtPrice,
  lineTotal: line.lineTotal,
  imageUrl: line.imageUrl,
  tone: line.tone,
  stock: line.stock,
})

/**
 * A guest line is only an identifier, so it is completed from the live catalogue
 * entry. The price shown is the catalogue's, which is the same price the server
 * will charge once the bag is merged at sign-in.
 */
const fromGuestLine = (line: { productId: string; quantity: number; selectedColor?: string | null; selectedSize?: string | null }, product: Product): CartViewLine => ({
  key: lineKey(line.productId, line.selectedColor ?? null, line.selectedSize ?? null),
  productId: product.id,
  slug: product.slug,
  name: product.name,
  category: product.category,
  quantity: line.quantity,
  selectedColor: line.selectedColor ?? null,
  selectedSize: line.selectedSize ?? null,
  unitPrice: product.price,
  compareAtPrice: product.compareAtPrice,
  lineTotal: Number((product.price * line.quantity).toFixed(2)),
  imageUrl: product.images[0]?.src ?? null,
  tone: product.tone,
  stock: product.stock,
})

/**
 * The bag has two lives. A signed-in shopper's lives on the server, so it
 * survives a new device and the checkout prices it. A guest's lives in the
 * browser as identifiers only, and is merged into the account at sign-in.
 */
export function CartProvider({ children }: PropsWithChildren) {
  const { user } = useAuth()
  const isSignedIn = user !== null

  const cart = useCart(isSignedIn)
  const addToCart = useAddToCart()
  const updateLine = useUpdateCartItem()
  const removeLine = useRemoveCartItem()
  const clear = useClearCart()

  // The guest lines are read once per render pass; the hook memoises the lookup.
  const guest = useGuestCartLines(!isSignedIn)

  const items = useMemo<CartViewLine[]>(() => {
    if (isSignedIn) {
      return (cart.data?.cart.items ?? []).map(fromServerLine)
    }

    return guest.lines.map((line) => fromGuestLine(line, line.product))
  }, [isSignedIn, cart.data, guest.lines])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      cartCount: items.reduce((total, line) => total + line.quantity, 0),
      subtotal: Number(items.reduce((total, line) => total + line.lineTotal, 0).toFixed(2)),
      isLoading: isSignedIn ? cart.isLoading : guest.isLoading,
      isGuest: !isSignedIn,
      error: cart.error instanceof Error ? cart.error.message : null,
      addItem: (product, quantity = 1, selectedColor, selectedSize) => {
        if (isSignedIn) {
          addToCart.addItem({ productId: product.id, quantity, selectedColor, selectedSize })
          return
        }

        guestCart.add({ productId: product.id, quantity, selectedColor, selectedSize })
      },
      updateQuantity: (productId, quantity, selectedColor, selectedSize) => {
        if (isSignedIn) {
          updateLine.updateItem({ productId, quantity, selectedColor, selectedSize })
          return
        }

        guestCart.update({ productId, quantity, selectedColor, selectedSize })
      },
      removeItem: (productId, selectedColor, selectedSize) => {
        if (isSignedIn) {
          removeLine.mutate({ productId, selectedColor, selectedSize })
          return
        }

        guestCart.remove(productId, selectedColor, selectedSize)
      },
      clearCart: () => {
        if (isSignedIn) {
          clear.mutate()
          return
        }

        guestCart.clear()
      },
    }),
    [items, isSignedIn, cart.isLoading, cart.error, guest.isLoading, addToCart, updateLine, removeLine, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
