import { apiClient } from '../lib/apiClient'
import type { AuthResponse, AuthUser, GuestState, LoginPayload, RegisterPayload } from '../types/api'

/**
 * `guestState` is optional and is filled in by the hooks, not by the pages, so no
 * screen has to remember to merge a guest's bag on the shopper's behalf.
 */
export const authService = {
  login: (payload: Omit<LoginPayload, 'guestState'> & { guestState?: GuestState }) =>
    apiClient.post<AuthResponse>('/api/auth/login', payload),

  register: (payload: Omit<RegisterPayload, 'guestState'> & { guestState?: GuestState }) =>
    apiClient.post<AuthResponse>('/api/auth/register', payload),

  /** Doubles as the silent "am I still signed in?" probe on every page load. */
  me: (signal?: AbortSignal) => apiClient.get<AuthResponse>('/api/auth/me', undefined, signal),

  updateProfile: (payload: { name?: string; phone?: string | null; city?: string | null }) =>
    apiClient.patch<{ user: AuthUser }>('/api/auth/me', payload),

  logout: () => apiClient.post<{ signedOut: boolean }>('/api/auth/logout'),

  logoutEverywhere: () => apiClient.post<{ signedOutEverywhere: boolean }>('/api/auth/logout-everywhere'),
}
