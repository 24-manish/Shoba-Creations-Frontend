import { apiClient } from '../lib/apiClient'
import type { CartQuery, CartResponse } from '../types/api'

export interface CartLineInput {
  productId: string
  quantity: number
  selectedColor?: string | null
  selectedSize?: string | null
}

export const cartApi = {
  /** Passing the chosen delivery and payment method returns a re-priced cart. */
  getCart: (query?: CartQuery, signal?: AbortSignal) => apiClient.get<CartResponse>('/api/cart', query, signal),

  addItem: (payload: CartLineInput) => apiClient.post<CartResponse>('/api/cart/items', payload),

  /** Quantity 0 removes the line, so there is no separate "remove" mutation. */
  updateItem: (payload: CartLineInput) => apiClient.patch<CartResponse>('/api/cart/items', payload),

  removeItem: (productId: string, selectedColor?: string | null, selectedSize?: string | null) =>
    apiClient.delete<CartResponse>(
      `/api/cart/items/${encodeURIComponent(productId)}?${new URLSearchParams({
        ...(selectedColor ? { color: selectedColor } : {}),
        ...(selectedSize ? { size: selectedSize } : {}),
      }).toString()}`,
    ),

  clear: () => apiClient.delete<CartResponse>('/api/cart'),
}
