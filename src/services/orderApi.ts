import { apiClient } from '../lib/apiClient'
import type { CheckoutPayload, Order, OrderDetailResult, OrderListResult, OrderStatus } from '../types/api'

export interface OrderQuery {
  status?: OrderStatus
  channel?: 'online_store' | 'wholesale'
  search?: string
  page?: number
  limit?: number
}

export const orderApi = {
  /** Placing the order also empties the server-side cart. */
  checkout: (payload: CheckoutPayload) => apiClient.post<{ order: Order }>('/api/orders', payload),

  listMine: (query?: OrderQuery, signal?: AbortSignal) => apiClient.get<OrderListResult>('/api/orders', query, signal),

  getMine: (orderNumber: string, signal?: AbortSignal) =>
    apiClient.get<OrderDetailResult>(`/api/orders/${encodeURIComponent(orderNumber)}`, undefined, signal),

  cancelMine: (orderNumber: string) =>
    apiClient.post<{ order: Order }>(`/api/orders/${encodeURIComponent(orderNumber)}/cancel`),
}
