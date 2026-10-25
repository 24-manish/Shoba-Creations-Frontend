import { useMemo, type PropsWithChildren } from 'react'
import { guestWishlist } from '../lib/guestStore'
import { useClearWishlist, useGuestWishlistProducts, useToggleWishlist, useWishlist } from '../hooks/useCommerce'
import { useAuth } from './useAuth'
import { WishlistContext, type WishlistContextValue } from './wishlistState'

/**
 * Like the bag, the wishlist has two lives: a server list of full products for a
 * signed-in shopper, and a browser list of identifiers for a guest that is joined
 * against the live catalogue. Callers only ever see one shape.
 */
export function WishlistProvider({ children }: PropsWithChildren) {
  const { user } = useAuth()
  const isSignedIn = user !== null

  const wishlist = useWishlist(isSignedIn)
  const toggle = useToggleWishlist()
  const clearServer = useClearWishlist()
  const guest = useGuestWishlistProducts(!isSignedIn)

  const productIds = useMemo(
    () => (isSignedIn ? (wishlist.data?.productIds ?? []) : guest.productIds),
    [isSignedIn, wishlist.data, guest.productIds],
  )

  const products = useMemo(
    () => (isSignedIn ? (wishlist.data?.items ?? []) : guest.products),
    [isSignedIn, wishlist.data, guest.products],
  )

  const value = useMemo<WishlistContextValue>(
    () => ({
      productIds,
      products,
      count: productIds.length,
      isLoading: isSignedIn ? wishlist.isLoading : guest.isLoading,
      error: wishlist.error instanceof Error ? wishlist.error.message : null,
      isWishlisted: (productId) => productIds.includes(productId),
      toggleWishlist: (productId) => {
        if (isSignedIn) {
          toggle.mutate({ productId, saved: productIds.includes(productId) })
          return
        }

        guestWishlist.toggle(productId)
      },
      // A signed-in shopper's wishlist lives on the server, so clearing the local
      // copy would be a no-op that looked like a bug.
      clearWishlist: () => {
        if (isSignedIn) {
          clearServer.mutate()
          return
        }

        guestWishlist.clear()
      },
    }),
    [productIds, products, isSignedIn, wishlist.isLoading, wishlist.error, guest.isLoading, toggle, clearServer],
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}
