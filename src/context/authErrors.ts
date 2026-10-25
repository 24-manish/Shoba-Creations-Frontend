import { ApiError } from '../lib/apiClient'

/**
 * The auth screens need two things from a failed request: a sentence to show,
 * and a `{ field: message }` map to mark individual inputs. Both live here
 * rather than in `AuthContext.tsx` so they can be tested without a renderer,
 * and so the logic that decides *which* failed request to report cannot be
 * written inline where it is easy to get wrong.
 */

/** The slice of a TanStack mutation this module reads. */
interface SettledMutation {
  isError: boolean
  error: unknown
}

/** Which form the shopper was on. They are not interchangeable: only
 *  registration can usefully say *which* input was wrong. */
export type AuthErrorSource = 'login' | 'register'

export interface ResolvedAuthError {
  source: AuthErrorSource
  error: unknown
}

/**
 * Matches the backend's own wording in `auth-service.js`, so the two never drift.
 */
const CREDENTIALS_REJECTED = 'Email or password is incorrect'

/**
 * A failed sign-in is explained by the server; anything else is generic.
 */
export const describeAuthError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error && error.name === 'TypeError') {
    // fetch only rejects this way when the API is unreachable.
    return 'We could not reach the store. Please check your connection and try again.'
  }

  return 'Something went wrong. Please try again.'
}

/**
 * Picks the error to report out of the auth mutations, and remembers which form
 * it came from.
 *
 * The deciding question is "which one *settled with* an error", not "which one
 * is running". A mutation's error only exists after it settles, and by then
 * `isPending` is already false — so selecting on `isPending` reads a mutation
 * that never failed and silently drops the server's message.
 */
export const resolveAuthError = (
  login: SettledMutation,
  registration: SettledMutation,
): ResolvedAuthError | null => {
  if (login.isError) return { source: 'login', error: login.error }
  if (registration.isError) return { source: 'register', error: registration.error }

  return null
}

/**
 * A rejected sign-in reads the same whatever the server objected to.
 *
 * `POST /api/auth/login` reaches its credentials check only when the request
 * schema passes. A malformed address fails `z.string().email()` first and comes
 * back as `400 VALIDATION_ERROR` with the developer-facing message
 * "Validation failed", while a well-formed address with the wrong password
 * comes back as `401 INVALID_CREDENTIALS`. Both mean the same thing to someone
 * standing at a login form: those details did not match an account. Collapsing
 * them here keeps the form from telling the shopper which of the two they got
 * wrong, which is the distinction worth not drawing.
 *
 * The codes that *do* pass through unchanged are the ones a shopper can act on
 * differently: a deactivated account is not a typo, and a rate-limit is not a
 * wrong password.
 */
export const describeLoginError = (error: unknown): string => {
  if (
    error instanceof ApiError &&
    (error.code === 'INVALID_CREDENTIALS' || error.code === 'VALIDATION_ERROR')
  ) {
    return CREDENTIALS_REJECTED
  }

  return describeAuthError(error)
}

/**
 * Maps a validation failure onto `{ field: message }`; anything else has no
 * per-field detail to offer.
 *
 * Sign-in gets none, deliberately. Marking the email input invalid while the
 * banner says "email or password is incorrect" contradicts the banner, and the
 * per-field signal is exactly the distinction `describeLoginError` removes.
 */
export const authFieldErrors = (
  error: unknown,
  source: AuthErrorSource,
): Record<string, string> => {
  if (source === 'login') return {}

  return error instanceof ApiError ? error.fieldErrors : {}
}