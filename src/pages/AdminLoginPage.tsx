import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { HeritageImage } from '../components/HeritageImage'
import { Ornament } from '../components/Ornament'
import { useAuth } from '../context/useAuth'
import { useSiteImages } from '../hooks/useEditorial'

interface LoginLocationState {
  from?: string
}

const adminDestination = (from?: string) =>
  from?.startsWith('/admin') && !from.startsWith('/admin/login') ? from : '/admin'

export function AdminLoginPage() {
  const { user, isAdmin, signIn, isPending, error, clearAuthError } = useAuth()
  const { data } = useSiteImages()
  const images = data?.images
  const location = useLocation()
  const state = location.state as LoginLocationState | null
  const destination = adminDestination(state?.from)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  if (user && isAdmin) {
    return <Navigate to={destination} replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearAuthError()

    // On success the session query flips and the redirect above takes over. A
    // failure is rendered from `error`, so the rejection is absorbed here.
    await signIn(email, password).catch(() => undefined)
  }

  return (
    <div className="admin-login-page">
      <section className="admin-login-visual">
        <HeritageImage
          src={images?.palace?.url ?? ''}
          alt={images?.palace?.alt ?? 'Details of a historic Indian palace'}
          loading="eager"
        />
        <div className="admin-login-visual__shade" />
        <Link to="/store" className="admin-login-wordmark"><span>Shoba</span><em>Creations</em></Link>
        <div className="admin-login-visual__content">
          <p>Private workspace</p>
          <h1>Keep every detail<br />beautifully <em>in order.</em></h1>
          <span>Warehouse desk A · SS 2026</span>
        </div>
      </section>

      <main className="admin-login-main">
        <div className="admin-login-card">
          <Link to="/store" className="auth-back-link">← Return to storefront</Link>
          <div className="admin-login-card__heading">
            <span className="admin-login-card__mark">SC</span>
            <p className="admin-overline">Warehouse desk</p>
            <h2>Admin sign in</h2>
            <p>Access is restricted to authorised Shoba Creations team members.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label className="auth-field">
              <span>Admin email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  clearAuthError()
                  setEmail(event.target.value)
                }}
                autoComplete="email"
                placeholder="name@shobacreations.in"
                required
                autoFocus
              />
            </label>
            <label className="auth-field">
              <span>Password</span>
              <span className="auth-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => {
                  clearAuthError()
                  setPassword(event.target.value)
                }}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  required
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </span>
            </label>
            {error ? <p className="auth-error" role="alert">{error}</p> : null}
            <button type="submit" className="admin-button admin-button--dark admin-button--full" disabled={isPending}>
              {isPending ? 'Signing in…' : 'Enter warehouse desk'}
            </button>
          </form>

          <div className="admin-login-security">
            <span>⚿</span>
            <p>Accounts are issued by the Shoba Creations team. Sessions are secured with httpOnly cookies and a rotating refresh token.</p>
          </div>
          <Ornament compact />
        </div>
      </main>
    </div>
  )
}
