import type { GuestState } from '../types/api'

/**
 * A visitor who has not signed in still needs a bag, but `/api/cart` is a private
 * endpoint, so there is nowhere to persist it server-side. What is kept here is
 * therefore the minimum needed to rebuild the cart after sign-in: product ids,
 * quantities, and the chosen variant.
 *
 * Deliberately NOT stored: prices, stock, names, images or any other product
 * detail. Those are the server's to decide, and caching them in the browser is
 * how a storefront ends up showing a shopper a price the API will refuse.
 */

const CART_KEY = 'shoba.guestCart'
const WISHLIST_KEY = 'shoba.guestWishlist'

export interface GuestCartLine {
  productId: string
  quantity: number
  selectedColor?: string | null
  selectedSize?: string | null
}

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    // A corrupt or unreadable value must not stop the shop from working.
    return fallback
  }
}

const writeJson = (key: string, value: unknown): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Private browsing and full quotas both throw here; the cart is a
    // convenience for guests, so losing it is preferable to a broken page.
  }
}

/**
 * The guest bag lives in localStorage, which is not reactive. Without a nudge,
 * adding a product would write the line but leave the header badge and the bag
 * showing the old count until something else happened to re-render. Every write
 * therefore bumps this counter, and hooks read it as a dependency.
 */
let revision = 0
const listeners = new Set<() => void>()

const notify = (): void => {
  revision += 1
  for (const listener of listeners) listener()
}

/** Subscribes to guest-bag changes and re-renders when one is written. */
export const subscribeToGuestState = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** The current revision; changing values mean the stored bag has changed. */
export const guestStateRevision = (): number => revision

const normaliseLines = (value: unknown): GuestCartLine[] => {
  if (!Array.isArray(value)) return []

  return value.flatMap((line) => {
    if (typeof line !== 'object' || line === null) return []

    const { productId, quantity, selectedColor, selectedSize } = line as Partial<GuestCartLine>

    if (typeof productId !== 'string' || !productId) return []
    if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity < 1) return []

    return [{
      productId,
      // Clamped to the same maximum the API enforces, so a guest cart can never
      // ask for a quantity the server would reject.
      quantity: Math.min(Math.floor(quantity), 99),
      selectedColor: typeof selectedColor === 'string' ? selectedColor : null,
      selectedSize: typeof selectedSize === 'string' ? selectedSize : null,
    }]
  })
}

export const guestCart = {
  read: (): GuestCartLine[] => normaliseLines(readJson<unknown>(CART_KEY, [])),

  write: (lines: GuestCartLine[]): void => {
    writeJson(CART_KEY, lines)
    notify()
  },

  add: (line: GuestCartLine): GuestCartLine[] => {
    const lines = guestCart.read()
    // The same variant is one line server-side, so it is one line here too.
    const existing = lines.find(
      (item) =>
        item.productId === line.productId &&
        (item.selectedColor ?? null) === (line.selectedColor ?? null) &&
        (item.selectedSize ?? null) === (line.selectedSize ?? null),
    )

    const next = existing
      ? lines.map((item) =>
          item === existing ? { ...item, quantity: Math.min(item.quantity + line.quantity, 99) } : item,
        )
      : [...lines, { ...line, quantity: Math.min(line.quantity, 99) }]

    guestCart.write(next)
    return next
  },

  update: (line: GuestCartLine): GuestCartLine[] => {
    const next = guestCart
      .read()
      .map((item) =>
        item.productId === line.productId &&
        (item.selectedColor ?? null) === (line.selectedColor ?? null) &&
        (item.selectedSize ?? null) === (line.selectedSize ?? null)
          ? { ...item, quantity: Math.min(Math.max(Math.floor(line.quantity), 0), 99) }
          : item,
      )
      .filter((item) => item.quantity > 0)

    guestCart.write(next)
    return next
  },

  remove: (productId: string, selectedColor?: string | null, selectedSize?: string | null): GuestCartLine[] => {
    const next = guestCart
      .read()
      .filter(
        (item) =>
          !(
            item.productId === productId &&
            (item.selectedColor ?? null) === (selectedColor ?? null) &&
            (item.selectedSize ?? null) === (selectedSize ?? null)
          ),
      )

    guestCart.write(next)
    return next
  },

  clear: (): void => {
    try {
      window.localStorage.removeItem(CART_KEY)
    } catch {
      /* nothing to clean up */
    }
    notify()
  },

  count: (): number => guestCart.read().reduce((total, line) => total + line.quantity, 0),
}

const normaliseIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && id.length > 0))]
}

export const guestWishlist = {
  read: (): string[] => normaliseIds(readJson<unknown>(WISHLIST_KEY, [])),

  write: (ids: string[]): void => {
    writeJson(WISHLIST_KEY, ids)
    notify()
  },

  toggle: (productId: string): string[] => {
    const ids = guestWishlist.read()
    const next = ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId]

    guestWishlist.write(next)
    return next
  },

  clear: (): void => {
    try {
      window.localStorage.removeItem(WISHLIST_KEY)
    } catch {
      /* nothing to clean up */
    }
    notify()
  },
}

/**
 * What to post alongside the credentials. Only sent when there is something to
 * merge, so a returning shopper with an empty bag does not grow a request body
 * for no reason.
 */
export const readGuestState = (): GuestState | undefined => {
  const cart = guestCart.read()
  const wishlist = guestWishlist.read()

  if (cart.length === 0 && wishlist.length === 0) {
    return undefined
  }

  return {
    ...(cart.length > 0 ? { cart } : {}),
    ...(wishlist.length > 0 ? { wishlist } : {}),
  }
}

/** The server owns the merged cart and wishlist now, so the local copies go. */
export const clearGuestState = (): void => {
  guestCart.clear()
  guestWishlist.clear()
}
