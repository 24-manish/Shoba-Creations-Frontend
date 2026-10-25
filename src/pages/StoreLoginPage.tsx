import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { HeritageImage } from '../components/HeritageImage'
import { Ornament } from '../components/Ornament'
import { useAuth } from '../context/useAuth'
import { useSiteImages } from '../hooks/useEditorial'

interface LoginLocationState {
  from?: string
}

const customerDestination = (from?: string) =>
  from?.startsWith('/store/checkout') || from?.startsWith('/store/orders') ? from : '/store/orders'

export function StoreLoginPage() {
  const { user, isCustomer, signIn, isPending, error, clearAuthError } = useAuth()
  const { data } = useSiteImages()
  const images = data?.images
  const location = useLocation()
  const state = location.state as LoginLocationState | null
  const destination = customerDestination(state?.from)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  if (user && isCustomer) {
    return <Navigate to={destination} replace />
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearAuthError()

    // On success the session query flips and the redirect above takes over, so
    // there is nothing to navigate by hand. A failure is rendered from `error`
    // rather than thrown at the caller, so the rejection is absorbed here.
    await signIn(email, password).catch(() => undefined)
  }

  return (
    <div className="store-login-page">
      <div className="container store-login-shell">
        <section className="store-login-visual">
          <HeritageImage
            src={images?.heroSecondary?.url ?? ''}
            alt={images?.heroSecondary?.alt ?? 'Woman in a richly detailed traditional outfit'}
            loading="eager"
          />
          <div className="store-login-visual__shade" />
          <div className="store-login-visual__content">
            <p className="eyebrow">Your Shoba account</p>
            <h1>Every piece.<br /><em>One story.</em></h1>
            <p>Sign in to continue your checkout, revisit your orders, and keep your details ready for next time.</p>
          </div>
          <Ornament light />
        </section>

        <section className="store-login-panel">
          <div className="store-login-panel__intro">
            <p className="eyebrow">Welcome back</p>
            <h2>Sign in to continue</h2>
            <p>The collection is open to everyone. An account is only needed at checkout and for order history.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label className="auth-field">
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  clearAuthError()
                  setEmail(event.target.value)
                }}
                autoComplete="email"
                placeholder="you@example.com"
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
            <button type="submit" className="button button--dark button--full" disabled={isPending}>
              {isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            New to Shoba Creations? <Link to="/store/register">Create an account</Link>
          </p>

          <Link to="/store/shop" className="auth-back-link">← Continue shopping without signing in</Link>
        </section>
      </div>
    </div>
  )
}
