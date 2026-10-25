import type { OrderQuery } from '../services/orderApi'
import type { CartQuery, ProductListParams } from '../types/api'

/**
 * Every key a query is stored under. Keeping them in one place is what makes
 * targeted invalidation possible: saving a product must refresh the catalogue,
 * the product page, the related rail and the admin table without guessing.
 */
export const queryKeys = {
  session: ['session'] as const,

  categories: ['categories'] as const,

  content: {
    all: ['content'] as const,
    home: ['content', 'home'] as const,
    stories: ['content', 'stories'] as const,
    story: (slug: string) => ['content', 'stories', slug] as const,
    testimonials: ['content', 'testimonials'] as const,
    images: ['content', 'images'] as const,
  },

  products: {
    all: ['products'] as const,
    list: (params: ProductListParams) => ['products', 'list', params] as const,
    featured: ['products', 'featured'] as const,
    detail: (slug: string) => ['products', 'detail', slug] as const,
  },

  cart: {
    all: ['cart'] as const,
    current: (query?: CartQuery) => ['cart', 'current', query ?? {}] as const,
  },

  wishlist: ['wishlist'] as const,

  orders: {
    mine: (query?: OrderQuery) => ['orders', 'mine', query ?? {}] as const,
    detail: (orderNumber: string) => ['orders', 'detail', orderNumber] as const,
  },

  admin: {
    all: ['admin'] as const,
    dashboard: ['admin', 'dashboard'] as const,
    products: (params: ProductListParams & { includeInactive?: boolean }) =>
      ['admin', 'products', params] as const,
    categories: ['admin', 'categories'] as const,
    orders: (query?: OrderQuery) => ['admin', 'orders', query ?? {}] as const,
    order: (orderNumber: string) => ['admin', 'orders', 'detail', orderNumber] as const,
    users: ['admin', 'users'] as const,
    lowStock: ['admin', 'low-stock'] as const,
  },
}
