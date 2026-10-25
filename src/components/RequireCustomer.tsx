import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

/** See RequireAdmin: the guard waits for `/me` so a refresh does not sign you out. */
export function RequireCustomer() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return null
  }

  if (!user) {
    return <Navigate to="/store/login" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />
  }

  return <Outlet />
}
