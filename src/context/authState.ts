import { createContext } from 'react'
import type { AuthUser } from '../types/api'

export interface RegisterInput {
  name: string
  email: string
  password: string
  phone?: string
  city?: string
}

/**
 * The backend has a single session: a signed-in shopper is either a customer or
 * an admin, and the role decides which half of the app they may see. The old
 * shape kept two independent sessions so that a fake "customer" and a fake
 * "admin" could both be present at once; that had no equivalent server-side and
 * is gone.
 */
export interface AuthContextValue {
  user: AuthUser | null
  /** True until the session probe answers, so guards can wait instead of redirecting. */
  isLoading: boolean
  isAdmin: boolean
  isCustomer: boolean
  isPending: boolean
  error: string | null
  /** `{ field: message }` from a 400, for marking individual inputs. */
  fieldErrors: Record<string, string>
  signIn: (email: string, password: string) => Promise<AuthUser>
  register: (input: RegisterInput) => Promise<AuthUser>
  signOut: () => Promise<void>
  /**
   * Discards the last failure so a stale message does not sit under the form
   * while the shopper edits their details for the next attempt.
   */
  clearAuthError: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
