import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

/**
 * Redirecting before the session probe answers would bounce a signed-in shopper
 * to the sign-in page on every refresh, because the cookie exists but `/me` has
 * not come back yet. Waiting is the difference between "session restored" and
 * "please sign in again".
 */
export function RequireAdmin() {
  const { user, isAdmin, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return null
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />
  }

  if (!isAdmin) {
    // Signed in, but not as an admin: the storefront is the only thing to show.
    return <Navigate to="/store" replace />
  }

  return <Outlet />
}
