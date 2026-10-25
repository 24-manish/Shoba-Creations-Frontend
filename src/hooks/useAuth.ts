import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../lib/apiClient'
import { clearGuestState, readGuestState } from '../lib/guestStore'
import { queryKeys } from '../lib/queryKeys'
import { authService } from '../services/authApi'
import type { AuthResponse, AuthUser, LoginPayload, RegisterPayload } from '../types/api'

/**
 * The single source of truth for who is signed in. The session lives in an
 * httpOnly cookie, so `GET /api/auth/me` is the only way to read it.
 *
 * A 401 here is the expected answer for a visitor, not an error: `me` resolves
 * to `null` so that signed-out is a value the app can render instead of a
 * failure state it has to special-case everywhere.
 */
export const useSession = () =>
  useQuery<AuthResponse | null>({
    queryKey: queryKeys.session,
    queryFn: async ({ signal }) => {
      try {
        return await authService.me(signal)
      } catch (error) {
        if (error instanceof ApiError && error.isUnauthenticated) {
          return null
        }

        throw error
      }
    },
    staleTime: 5 * 60_000,
  })

export const useCurrentUser = (): AuthUser | null => useSession().data?.user ?? null

/**
 * Sign-in and registration post any guest cart and wishlist alongside the
 * credentials; the server merges them and hands the merged state back, so the
 * caches are seeded from the response instead of being refetched.
 */
const useAuthenticate = <TVariables,>(mutationFn: (variables: TVariables) => Promise<AuthResponse>) => {
  const queryClient = useQueryClient()

  return useMutation<AuthResponse, ApiError, TVariables>({
    mutationFn,
    onSuccess: (session) => {
      queryClient.setQueryData(queryKeys.session, session)
      queryClient.setQueryData(queryKeys.cart.all, session.cart)
      queryClient.setQueryData(queryKeys.wishlist, session.wishlist)
      clearGuestState()
    },
  })
}

export const useLogin = () => {
  const queryClient = useQueryClient()
  const mutation = useAuthenticate<Omit<LoginPayload, 'guestState'>>((payload) =>
    authService.login({ ...payload, guestState: readGuestState() }),
  )

  return {
    ...mutation,
    login: mutation.mutateAsync,
    /**
     * Drops the last failure so the form starts clean. Distinct from `reset`
     * below, which clears the whole cache and would sign the shopper out.
     */
    clearError: () => mutation.reset(),
    /** Discards every cached answer, so the next visitor sees only their own data. */
    reset: () => queryClient.clear(),
  }
}

export const useRegister = () => {
  const mutation = useAuthenticate<Omit<RegisterPayload, 'guestState'>>((payload) =>
    authService.register({ ...payload, guestState: readGuestState() }),
  )

  return {
    ...mutation,
    register: mutation.mutateAsync,
    clearError: () => mutation.reset(),
  }
}

export const useLogout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => authService.logout(),
    // The cookie is cleared regardless of the request's fate, so the cached
    // session goes too; otherwise a failed sign-out would leave the UI signed in.
    onSettled: () => {
      queryClient.setQueryData(queryKeys.session, null)
      queryClient.removeQueries({ queryKey: queryKeys.cart.all })
      queryClient.removeQueries({ queryKey: queryKeys.wishlist })
      queryClient.removeQueries({ queryKey: queryKeys.admin.all })
    },
  })
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authService.updateProfile,
    onSuccess: ({ user }) => {
      queryClient.setQueryData<AuthResponse>(queryKeys.session, (current) =>
        current ? { ...current, user } : current,
      )
    },
  })
}
