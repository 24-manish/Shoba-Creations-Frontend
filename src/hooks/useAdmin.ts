import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../lib/queryKeys'
import { adminApi, type CategoryInput } from '../services/adminApi'
import type { OrderQuery } from '../services/orderApi'
import type { Category, OrderStatus, Product, ProductInput, ProductListParams } from '../types/api'

export const useAdminDashboard = (enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: ({ signal }) => adminApi.getDashboard(signal),
    enabled,
  })

export const useAdminProducts = (params: ProductListParams & { includeInactive?: boolean }, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.admin.products(params),
    queryFn: ({ signal }) => adminApi.listProducts(params, signal),
    enabled,
  })

export const useAdminCategories = (enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.admin.categories,
    queryFn: ({ signal }) => adminApi.listCategories(signal),
    enabled,
  })

export const useAdminOrders = (query: OrderQuery | undefined, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.admin.orders(query),
    queryFn: ({ signal }) => adminApi.listOrders(query, signal),
    enabled,
  })

export const useAdminOrder = (orderNumber: string | undefined, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.admin.order(orderNumber ?? ''),
    queryFn: ({ signal }) => adminApi.getOrder(orderNumber as string, signal),
    enabled: enabled && Boolean(orderNumber),
  })

export const useAdminUsers = (enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: ({ signal }) => adminApi.listUsers(signal),
    enabled,
  })

export const useAdminLowStock = (enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.admin.lowStock,
    queryFn: ({ signal }) => adminApi.getLowStock(signal),
    enabled,
  })

/**
 * A product edit is visible in the catalogue, on the product page, in the
 * related rail and in the admin table, so all four are invalidated together.
 */
const useProductWrite = <TVariables,>(mutationFn: (variables: TVariables) => Promise<{ product: Product }>) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: ({ product }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard })
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.lowStock })
      queryClient.setQueryData(queryKeys.products.detail(product.slug), (current) =>
        current ? { ...current, product } : current,
      )
    },
  })
}

export const useCreateProduct = () => {
  const mutation = useProductWrite((payload: ProductInput) => adminApi.createProduct(payload))
  return { ...mutation, createProduct: mutation.mutateAsync }
}

export const useUpdateProduct = () => {
  const mutation = useProductWrite(({ id, payload }: { id: string; payload: Partial<ProductInput> }) =>
    adminApi.updateProduct(id, payload),
  )

  return { ...mutation, updateProduct: mutation.mutateAsync }
}

export const useSetProductActive = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? adminApi.restoreProduct(id) : adminApi.archiveProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.lowStock })
    },
  })
}

export const useArchiveProducts = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productIds: string[]) => adminApi.archiveProducts(productIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.lowStock })
    },
  })
}

export const useRestoreProducts = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (productIds: string[]) => adminApi.restoreProducts(productIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.lowStock })
    },
  })
}

export const usePurgeProduct = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) => adminApi.purgeProduct(id, force),
    onSuccess: () => {
      // A purged product leaves every storefront surface: catalogue, related
      // rail, carts and wishlists that referenced it.
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist })
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.lowStock })
    },
  })
}

export const usePurgeProducts = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productIds, force }: { productIds: string[]; force?: boolean }) =>
      adminApi.purgeProducts(productIds, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.wishlist })
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.lowStock })
    },
  })
}

export const useUploadProductImages = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) => adminApi.uploadImages(id, files),
    onSuccess: ({ product }) => {
      queryClient.setQueryData(queryKeys.products.detail(product.slug), (current) =>
        current ? { ...current, product } : current,
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
    },
  })
}

export const useDeleteProductImage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, imageId }: { id: string; imageId: string }) => adminApi.deleteImage(id, imageId),
    onSuccess: ({ product }) => {
      queryClient.setQueryData(queryKeys.products.detail(product.slug), (current) =>
        current ? { ...current, product } : current,
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
    },
  })
}

export const useReorderProductImages = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, imageIds }: { id: string; imageIds: string[] }) => adminApi.reorderImages(id, imageIds),
    onSuccess: ({ product }) => {
      queryClient.setQueryData(queryKeys.products.detail(product.slug), (current) =>
        current ? { ...current, product } : current,
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all })
    },
  })
}

const useCategoryWrite = <TVariables,>(mutationFn: (variables: TVariables) => Promise<{ category: Category }>) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories })
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories })
    },
  })
}

export const useCreateCategory = () => {
  const mutation = useCategoryWrite((payload: CategoryInput) => adminApi.createCategory(payload))
  return { ...mutation, createCategory: mutation.mutateAsync }
}

export const useUpdateCategory = () => {
  const mutation = useCategoryWrite(({ id, payload }: { id: string; payload: Partial<CategoryInput> }) =>
    adminApi.updateCategory(id, payload),
  )

  return { ...mutation, updateCategory: mutation.mutateAsync }
}

export const useDeleteCategory = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories })
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.categories })
    },
  })
}

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderNumber, status }: { orderNumber: string; status: OrderStatus }) =>
      adminApi.updateOrderStatus(orderNumber, status),
    onSuccess: (_result, { orderNumber }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.orders() })
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.order(orderNumber) })
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard })
      // Stock levels change when an order is cancelled or re-entered.
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.lowStock })
    },
  })
}
