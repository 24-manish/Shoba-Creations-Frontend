/**
 * Shapes returned by the Shoba Creations API.
 *
 * These mirror the backend projections rather than the old local `Product`
 * model, so nothing has to be translated between the wire and the UI. The
 * notable differences from the previous mock types:
 *
 *  - `ProductImage` carries `id` and `position`, not just `src`/`alt`
 *  - `category` is whatever the catalogue says, not a closed union
 *  - order statuses are the backend's lowercase values
 *  - a cart line is not a full product; the server sends only what a bag needs
 */

export type AuthRole = 'customer' | 'admin'

/** The CSS tone used to tint a product's generated visual when it has no image. */
export type ProductTone = 'burgundy' | 'gold' | 'emerald' | 'ivory' | 'plum' | 'terracotta' | 'ink'

export interface AuthUser {
  id: string
  role: AuthRole
  name: string
  email: string
  initials: string
  city?: string | null
  phone?: string | null
  createdAt?: string
}

export interface ProductImage {
  id: string
  src: string
  alt: string
  position: number
}

export interface ProductColorOption {
  name: string
  /** A hex swatch such as `#8B1E3F`, matching the stored column. */
  hex: string
}

export interface Product {
  id: string
  name: string
  slug: string
  sku: string
  subcategory: string | null
  description: string | null
  price: number
  compareAtPrice: number | null
  discountLabel: string | null
  rating: number
  reviewCount: number
  stock: number
  reorderPoint: number
  colors: string[]
  colorOptions: ProductColorOption[]
  sizes: string[]
  fabric: string | null
  occasion: string | null
  collection: string | null
  region: string | null
  artisan: string | null
  details: string[]
  care: string[]
  tone: string | null
  badge: string | null
  isNew: boolean
  isFeatured: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  categoryId: string | null
  category: string | null
  categorySlug: string | null
  images: ProductImage[]
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  tagline: string | null
  heroImageUrl: string | null
  sortOrder: number
  isActive: boolean
  productCount: number
}

export type SortOption = 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'name'

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ProductListParams {
  category?: string
  search?: string
  sort?: SortOption
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  isFeatured?: boolean
  isNew?: boolean
  page?: number
  limit?: number
}

export interface ProductListResult {
  items: Product[]
  pagination: Pagination
}

export interface ProductDetailResult {
  product: Product
  related: Product[]
}

export interface ShippingOption {
  id: string
  label: string
  description: string
  cost: number
}

export type PaymentMethod = 'upi' | 'card' | 'cod'

export interface CartLine {
  id: string
  productId: string
  quantity: number
  selectedColor: string | null
  selectedSize: string | null
  name: string
  slug: string
  description: string | null
  price: number
  compareAtPrice: number | null
  stock: number
  tone: string | null
  isActive: boolean
  category: string | null
  imageUrl: string | null
  lineTotal: number
}

export interface Cart {
  id: string
  items: CartLine[]
  itemCount: number
  subtotal: number
  shippingCost?: number
  handlingFee?: number
  total?: number
}

export interface CartResponse {
  cart: Cart
  shippingOptions: ShippingOption[]
}

export interface Wishlist {
  items: Product[]
  count: number
  productIds: string[]
}

export type OrderStatus = 'processing' | 'packed' | 'shipped' | 'delivered' | 'cancelled'
export type OrderChannel = 'online_store' | 'wholesale'
export type PaymentStatus = 'pending' | 'paid'

export interface OrderLine {
  id: string
  productId: string
  productName: string
  productSlug: string | null
  sku: string | null
  imageUrl: string | null
  selectedColor: string | null
  selectedSize: string | null
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  channel: OrderChannel
  customerName: string
  customerEmail: string
  shippingName: string
  shippingEmail: string
  shippingPhone: string
  shippingAddress: string
  shippingCity: string
  shippingState: string | null
  shippingPincode: string
  shippingMethod: string
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  note: string | null
  itemCount: number
  subtotal: number
  shippingCost: number
  handlingFee: number
  total: number
  createdAt: string
  updatedAt: string
  items: OrderLine[]
}

export interface OrderListResult {
  orders: Order[]
  pagination: Pagination
}

/** A single order with its lines, which only the detail endpoints return. */
export interface OrderDetail extends Order {
  items: OrderLine[]
}

/**
 * Only the admin detail endpoint reports the transitions the server will
 * actually allow from the current status; a customer sees the status only.
 */
export interface OrderDetailResult {
  order: OrderDetail
  availableTransitions?: OrderStatus[]
}

/** The cart totals the server computed for the chosen delivery and payment method. */
export interface CartQuery {
  shippingId?: ShippingOption['id']
  paymentMethod?: PaymentMethod
}

export interface CheckoutPayload {
  shippingName: string
  shippingEmail: string
  shippingPhone: string
  shippingAddress: string
  shippingCity: string
  shippingState?: string
  shippingPincode: string
  shippingMethod: string
  paymentMethod: PaymentMethod
  note?: string
}

/** A guest cart or wishlist handed over at sign-in so the server can merge it. */
export interface GuestState {
  cart?: Array<{ productId: string; quantity: number; selectedColor?: string | null; selectedSize?: string | null }>
  wishlist?: string[]
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  phone?: string
  city?: string
  guestState?: GuestState
}

export interface LoginPayload {
  email: string
  password: string
  guestState?: GuestState
}

/**
 * Login, register and `/me` all answer with the same envelope, so a sign-in can
 * seed the cart and wishlist caches from the guest data the server just merged.
 */
export interface AuthResponse {
  user: AuthUser
  cart: Cart
  wishlist: Wishlist
}

/** The trimmed order row the dashboard shows, not a full order. */
export interface DashboardOrder {
  id: string
  orderNumber: string
  status: OrderStatus
  total: number
  itemCount: number
  createdAt: string
  shippingName: string
}

export interface DashboardSummary {
  totalOrders: number
  awaitingFulfilment: number
  cancelledOrders: number
  ordersThisMonth: number
  revenueLifetime: number
  revenueThisMonth: number
  averageOrderValue: number
  statusCounts: Partial<Record<OrderStatus, number>>
  revenueByDay: Array<{ day: string; revenue: number; orders: number }>
  recentOrders: DashboardOrder[]
  lowStock: LowStockItem[]
  bestSellers: Array<{ productId: string; productName: string; productSlug: string | null; unitsSold: number; revenue: number }>
}

export interface LowStockItem {
  id: string
  name: string
  slug: string
  sku: string
  stock: number
  reorderPoint: number
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: AuthRole
  phone: string | null
  city: string | null
  initials: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductInput {
  name: string
  subcategory?: string | null
  description?: string | null
  price: number
  compareAtPrice?: number | null
  discountLabel?: string | null
  rating?: number
  reviewCount?: number
  stock: number
  reorderPoint?: number
  colors?: string[]
  colorOptions?: ProductColorOption[]
  sizes?: string[]
  fabric?: string | null
  occasion?: string | null
  collection?: string | null
  region?: string | null
  artisan?: string | null
  details?: string[]
  care?: string[]
  tone?: string | null
  badge?: string | null
  isNew?: boolean
  isFeatured?: boolean
  /** `categoryId` wins when both are sent; `categoryName` creates the category. */
  categoryId?: string | null
  categoryName?: string
}

// ---------------------------------------------------------------------------
// Editorial content
// ---------------------------------------------------------------------------

/** A journal card from the homepage, previously hardcoded in the bundle. */
export interface EditorialStory {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string | null
  imageUrl: string
  imageAlt: string
  readTime: string | null
  authorName: string | null
  sortOrder: number
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Testimonial {
  id: string
  userId: string | null
  name: string
  city: string | null
  quote: string
  rating: number
  imageUrl: string | null
  imageAlt: string
  sortOrder: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

/**
 * A brand image that belongs to no single record. Every entry is nullable: a
 * deactivated or unseeded image comes back as null, and the page decides how to
 * render around it rather than receiving a broken URL.
 */
export interface SiteImage {
  id: string
  key: string
  url: string
  alt: string
  width: number | null
  height: number | null
  createdAt: string
  updatedAt: string
}

export interface SiteImages {
  hero: SiteImage | null
  heroSecondary: SiteImage | null
  palace: SiteImage | null
  palaceSecondary: SiteImage | null
}

/** Everything the homepage renders, fetched in a single request. */
export interface HomepageContent {
  stories: EditorialStory[]
  testimonials: Testimonial[]
  images: SiteImages
}
