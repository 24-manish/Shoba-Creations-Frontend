import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { catalogApi } from '../services/catalogApi'
import type { ProductListParams } from '../types/api'

export const useProducts = (params: ProductListParams, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: queryKeys.products.list(params),
    queryFn: ({ signal }) => catalogApi.listProducts(params, signal),
    // Keeps the previous page on screen while the next one loads, so paging
    // through the catalogue does not flash an empty grid.
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  })

export const useProduct = (slug: string | undefined) =>
  useQuery({
    queryKey: queryKeys.products.detail(slug ?? ''),
    queryFn: ({ signal }) => catalogApi.getProduct(slug as string, signal),
    enabled: Boolean(slug),
  })

export const useFeaturedProducts = () =>
  useQuery({
    queryKey: queryKeys.products.featured,
    queryFn: ({ signal }) => catalogApi.getFeatured(signal),
  })

export const useCategories = () =>
  useQuery({
    queryKey: queryKeys.categories,
    queryFn: ({ signal }) => catalogApi.listCategories(signal),
    // The category list changes only when an admin edits it, so it can stay
    // fresh for far longer than a product page.
    staleTime: 10 * 60_000,
  })
