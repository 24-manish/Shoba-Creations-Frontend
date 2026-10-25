import { apiClient } from '../lib/apiClient'
import type { Wishlist } from '../types/api'

/**
 * The wishlist endpoints answer with `{ wishlist }` inside the data envelope, so
 * the inner object is unwrapped here and the rest of the app only ever deals
 * with a `Wishlist`.
 */
const unwrap = async <T,>(request: Promise<{ wishlist: T }>): Promise<T> => (await request).wishlist

export const wishlistApi = {
  getWishlist: (signal?: AbortSignal) => unwrap(apiClient.get<{ wishlist: Wishlist }>('/api/wishlist', undefined, signal)),

  addItem: (productId: string) => unwrap(apiClient.post<{ wishlist: Wishlist }>(`/api/wishlist/${encodeURIComponent(productId)}`)),

  removeItem: (productId: string) => unwrap(apiClient.delete<{ wishlist: Wishlist }>(`/api/wishlist/${encodeURIComponent(productId)}`)),

  clear: () => unwrap(apiClient.delete<{ wishlist: Wishlist }>('/api/wishlist')),
}
