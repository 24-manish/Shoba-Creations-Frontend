import { useMemo, useSyncExternalStore } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  guestCart,
  guestStateRevision,
  guestWishlist,
  subscribeToGuestState,
  type GuestCartLine,
} from '../lib/guestStore'
import { queryKeys } from '../lib/queryKeys'
import { cartApi, type CartLineInput } from '../services/cartApi'
import { catalogApi } from '../services/catalogApi'
import { orderApi, type OrderQuery } from '../services/orderApi'
import { wishlistApi } from '../services/wishlistApi'
import type { CartQuery, CartResponse, CheckoutPayload, Product, Wishlist } from '../types/api'

/**
 * The cart is only enabled for a signed-in shopper: `/api/cart` is a private
 * route, and a guest cart is held in the browser until the moment of sign-in.
 */
export const useCart = (enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.cart.current(),
    queryFn: ({ signal }) => cartApi.getCart(undefined, signal),
    enabled,
  })

/**
 * The checkout screen needs the server's own arithmetic for the chosen delivery
 * and payment method, so it re-asks for the same cart with those as filters.
 *
 * The first call deliberately goes out without a `shippingId`: that is the call
 * which returns `shippingOptions`, so gating on one would leave the delivery
 * dropdown with nothing to render and the shopper stuck on "loading".
 */
export const usePricedCart = (query: CartQuery, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.cart.current(query),
    queryFn: ({ signal }) => cartApi.getCart(query, signal),
    enabled: enabled && Boolean(query.paymentMethod),
    placeholderData: keepPreviousData,
  })

/**
 * Every cart mutation answers with the whole re-priced cart, so the result is
 * written straight into the cache instead of triggering another round trip.
 *
 * The cache is rolled back on failure so a rejected add — say, when a piece sold
 * out since the page was rendered — leaves the bag the shopper already had.
 */
const useCartMutation = <TVariables,>(mutationFn: (variables: TVariables) => Promise<CartResponse>) => {
  const queryClient = useQueryClient()

  return useMutation<CartResponse, Error, TVariables, { previous?: CartResponse }>({
    mutationFn,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.all })
      const previous = queryClient.getQueryData<CartResponse>(queryKeys.cart.current())

      return { previous }
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.cart.current(), context.previous)
      }
    },
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.cart.current(), response)
      // The priced variants are keyed by delivery method, so they are stale too.
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all })
    },
  })
}

export const useAddToCart = () => {
  const mutation = useCartMutation<CartLineInput>(cartApi.addItem)
  return { ...mutation, addItem: (payload: CartLineInput) => mutation.mutateAsync(payload) }
}

export const useUpdateCartItem = () => {
  const mutation = useCartMutation<CartLineInput>(cartApi.updateItem)
  return { ...mutation, updateItem: (payload: CartLineInput) => mutation.mutateAsync(payload) }
}

export const useRemoveCartItem = () =>
  useCartMutation<Omit<CartLineInput, 'quantity'>>(({ productId, selectedColor, selectedSize }) =>
    cartApi.removeItem(productId, selectedColor, selectedSize),
  )

export const useClearCart = () => {
  const mutation = useCartMutation<void>(() => cartApi.clear())
  return { ...mutation, clear: () => mutation.mutateAsync() }
}

export const useWishlist = (enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.wishlist,
    queryFn: ({ signal }) => wishlistApi.getWishlist(signal),
    enabled,
  })

/**
 * A guest bag and a guest wishlist hold identifiers only, so anything the UI
 * needs to render them — a name, a price, an image — has to be joined against the
 * live catalogue here. The prices shown are still the server's; only the
 * association is made in the browser, because there is no server-side guest cart
 * to join against.
 *
 * The catalogue is fetched once and cached, so a guest adding five pieces does
 * not trigger five requests. A large catalogue would want a by-id endpoint here
 * instead; at this size the single list is the cheaper trade.
 */
export const useProductLookup = (productIds: string[]) => {
  const key = [...productIds].sort().join(',')

  const { data, isLoading } = useQuery({
    queryKey: [...queryKeys.products.all, 'lookup', key],
    queryFn: ({ signal }) => catalogApi.listProducts({ limit: 100 }, signal),
    enabled: productIds.length > 0,
    staleTime: 5 * 60_000,
  })

  const byId = useMemo(
    () => new Map((data?.items ?? []).map((product) => [product.id, product])),
    [data],
  )

  return { byId, isLoading }
}

/**
 * The guest bag is kept in localStorage, which React cannot observe. Subscribing
 * to the store's revision counter is what makes the badge and the bag update the
 * moment a guest adds something, rather than on the next unrelated render.
 *
 * While signed in the server owns the bag, so the empty fallback is returned and
 * nothing is read from storage.
 */
const useGuestState = <T,>(enabled: boolean, read: () => T, fallback: T): T => {
  useSyncExternalStore(subscribeToGuestState, guestStateRevision, guestStateRevision)

  return useMemo(() => (enabled ? read() : fallback), [enabled, read, fallback])
}

/** True while a guest's identifiers are being matched to real catalogue rows. */
export const useGuestCartLines = (enabled: boolean) => {
  const empty: GuestCartLine[] = []
  const lines = useGuestState(enabled, guestCart.read, empty)
  const { byId, isLoading } = useProductLookup(lines.map((line) => line.productId))

  return {
    lines: lines
      .map((line) => {
        const product = byId.get(line.productId)
        return product ? { ...line, product } : null
      })
      .filter((line): line is { product: Product } & typeof line => line !== null),
    isLoading,
  }
}

export const useGuestWishlistProducts = (enabled: boolean) => {
  const empty: string[] = []
  const ids = useGuestState(enabled, guestWishlist.read, empty)
  const { byId, isLoading } = useProductLookup(ids)

  return {
    productIds: ids,
    products: ids.flatMap((id) => {
      const product = byId.get(id)
      return product ? [product] : []
    }),
    isLoading,
  }
}

export const useToggleWishlist = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, saved }: { productId: string; saved: boolean }) =>
      saved ? wishlistApi.removeItem(productId) : wishlistApi.addItem(productId),
    onSuccess: (wishlist: Wishlist) => {
      queryClient.setQueryData(queryKeys.wishlist, wishlist)
    },
  })
}

export const useClearWishlist = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => wishlistApi.clear(),
    onSuccess: (wishlist) => queryClient.setQueryData(queryKeys.wishlist, wishlist),
  })
}

export const useMyOrders = (query: OrderQuery | undefined, enabled = true) =>
  useQuery({
    queryKey: queryKeys.orders.mine(query),
    queryFn: ({ signal }) => orderApi.listMine(query, signal),
    enabled,
    placeholderData: keepPreviousData,
  })

export const useMyOrder = (orderNumber: string | undefined) =>
  useQuery({
    queryKey: queryKeys.orders.detail(orderNumber ?? ''),
    queryFn: ({ signal }) => orderApi.getMine(orderNumber as string, signal),
    enabled: Boolean(orderNumber),
  })

export const useCancelOrder = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderNumber: string) => orderApi.cancelMine(orderNumber),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all })
    },
  })
}

/** Placing an order empties the server-side cart, so both caches must be reset. */
export const useCheckout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CheckoutPayload) => orderApi.checkout(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.setQueryData(queryKeys.orders.detail(response.order.orderNumber), { order: response.order })
    },
  })
}
