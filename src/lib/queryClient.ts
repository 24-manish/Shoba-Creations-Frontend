import { QueryClient } from '@tanstack/react-query'
import { ApiError } from './apiClient'

/**
 * A 401 is a legitimate answer ("you are signed out"), not a transient fault, so
 * it must not be retried; every other failure is worth one more attempt.
 */
const shouldRetry = (failureCount: number, error: unknown): boolean => {
  if (error instanceof ApiError && error.status < 500) {
    return false
  }

  return failureCount < 1
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
})
