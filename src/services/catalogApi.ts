import { apiClient } from '../lib/apiClient'
import type { Category, Product, ProductDetailResult, ProductListParams, ProductListResult } from '../types/api'

export const catalogApi = {
  listProducts: (params: ProductListParams, signal?: AbortSignal) =>
    apiClient.get<ProductListResult>('/api/products', params, signal),

  getProduct: (slug: string, signal?: AbortSignal) =>
    apiClient.get<ProductDetailResult>(`/api/products/${encodeURIComponent(slug)}`, undefined, signal),

  getFeatured: (signal?: AbortSignal) => apiClient.get<{ products: Product[] }>('/api/products/featured', undefined, signal),

  listCategories: (signal?: AbortSignal) =>
    apiClient.get<{ categories: Category[] }>('/api/categories', undefined, signal),
}
