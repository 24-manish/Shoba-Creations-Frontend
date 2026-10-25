import { apiClient } from '../lib/apiClient'
import type { OrderQuery } from './orderApi'
import type {
  AdminUser,
  Category,
  DashboardSummary,
  LowStockItem,
  Order,
  OrderDetailResult,
  OrderListResult,
  OrderStatus,
  Product,
  ProductInput,
  ProductListParams,
  ProductListResult,
} from '../types/api'

export interface CategoryInput {
  name: string
  slug?: string
  description?: string | null
  tagline?: string | null
  heroImageUrl?: string | null
  sortOrder?: number
  isActive?: boolean
}

export const adminApi = {
  getDashboard: (signal?: AbortSignal) => apiClient.get<DashboardSummary>('/api/admin/dashboard', undefined, signal),

  /** `includeInactive` is admin-only; the public catalogue hides archived products. */
  listProducts: (params: ProductListParams & { includeInactive?: boolean } = {}, signal?: AbortSignal) =>
    apiClient.get<ProductListResult>('/api/admin/products', params, signal),

  createProduct: (payload: ProductInput) => apiClient.post<{ product: Product }>('/api/admin/products', payload),

  updateProduct: (id: string, payload: Partial<ProductInput>) =>
    apiClient.patch<{ product: Product }>(`/api/admin/products/${id}`, payload),

  archiveProduct: (id: string) => apiClient.delete<{ product: Product }>(`/api/admin/products/${id}`),

  restoreProduct: (id: string) => apiClient.post<{ product: Product }>(`/api/admin/products/${id}/restore`),

  /** Bulk mutations answer with affected ids so the table can reconcile its selection. */
  archiveProducts: (productIds: string[]) =>
    apiClient.post<{ productIds: string[] }>('/api/admin/products/bulk-archive', { productIds }),

  restoreProducts: (productIds: string[]) =>
    apiClient.post<{ productIds: string[] }>('/api/admin/products/bulk-restore', { productIds }),

  purgeProduct: (id: string, force = false) =>
    apiClient.delete<{ product: Product }>(`/api/admin/products/${id}/permanent`, { force }),

  purgeProducts: (productIds: string[], force = false) =>
    apiClient.post<{ products: Product[] }>('/api/admin/products/bulk-purge', { productIds, force }),

  // Images are uploaded as multipart `images` files, and every image mutation
  // answers with the whole product so the cache needs no follow-up fetch.
  uploadImages: (id: string, files: File[]) => {
    const form = new FormData()
    files.forEach((file) => form.append('images', file))

    return apiClient.upload<{ product: Product }>(`/api/admin/products/${id}/images`, form)
  },

  deleteImage: (id: string, imageId: string) =>
    apiClient.delete<{ product: Product }>(`/api/admin/products/${id}/images/${imageId}`),

  reorderImages: (id: string, imageIds: string[]) =>
    apiClient.put<{ product: Product }>(`/api/admin/products/${id}/images`, { imageIds }),

  listCategories: (signal?: AbortSignal) =>
    apiClient.get<{ categories: Category[] }>('/api/admin/categories', undefined, signal),

  createCategory: (payload: CategoryInput) => apiClient.post<{ category: Category }>('/api/admin/categories', payload),

  updateCategory: (id: string, payload: Partial<CategoryInput>) =>
    apiClient.patch<{ category: Category }>(`/api/admin/categories/${id}`, payload),

  deleteCategory: (id: string) => apiClient.delete<{ category: Category }>(`/api/admin/categories/${id}`),

  listOrders: (query?: OrderQuery, signal?: AbortSignal) =>
    apiClient.get<OrderListResult>('/api/admin/orders', query, signal),

  getOrder: (orderNumber: string, signal?: AbortSignal) =>
    apiClient.get<OrderDetailResult>(`/api/admin/orders/${encodeURIComponent(orderNumber)}`, undefined, signal),

  /**
   * The status change also reports which transitions remain legal from the new
   * state, so the picker never offers a move the server will reject.
   */
  updateOrderStatus: (orderNumber: string, status: OrderStatus) =>
    apiClient.patch<{ order: Order; availableTransitions: OrderStatus[] }>(
      `/api/admin/orders/${encodeURIComponent(orderNumber)}/status`,
      { status },
    ),

  listUsers: (signal?: AbortSignal) => apiClient.get<{ users: AdminUser[] }>('/api/admin/users', undefined, signal),

  getLowStock: (signal?: AbortSignal) => apiClient.get<{ products: LowStockItem[] }>('/api/admin/low-stock', undefined, signal),
}
