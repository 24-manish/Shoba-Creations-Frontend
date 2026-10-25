import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { HeritageImage } from '../components/HeritageImage'
import { Ornament } from '../components/Ornament'
import { useAuth } from '../context/useAuth'
import { useSiteImages } from '../hooks/useEditorial'

const MIN_PASSWORD_LENGTH = 8

export function StoreRegisterPage() {
  const { user, isCustomer, register, isPending, error, fieldErrors } = useAuth()
  const { data } = useSiteImages()
  const images = data?.images

  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', city: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')

  if (user && isCustomer) {
    return <Navigate to="/store/orders" replace />
  }

  const update = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setLocalError('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLocalError('')

    // Checked here so the shopper is told immediately, without a round trip.
    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setLocalError(`Choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }

    await register({
      name: form.name,
      email: form.email,
      password: form.password,
      ...(form.phone ? { phone: form.phone } : {}),
      ...(form.city ? { city: form.city } : {}),
    })
    // On success the session query flips and the redirect above takes over.
  }

  const message = localError || error

  return (
    <div className="store-login-page">
      <div className="container store-login-shell">
        <section className="store-login-visual">
          <HeritageImage
            src={images?.palaceSecondary?.url ?? ''}
            alt={images?.palaceSecondary?.alt ?? 'Heritage jewellery resting on carved stone'}
            loading="eager"
          />
          <div className="store-login-visual__shade" />
          <div className="store-login-visual__content">
            <p className="eyebrow">Join Shoba Creations</p>
            <h1>Keep your<br /><em>story together.</em></h1>
            <p>One account for your orders, your saved pieces, and a faster checkout.</p>
          </div>
          <Ornament light />
        </section>

        <section className="store-login-panel">
          <div className="store-login-panel__intro">
            <p className="eyebrow">Create an account</p>
            <h2>Welcome to the house</h2>
            <p>It takes a moment. Anything already in your bag is saved to the new account.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label className="auth-field">
              <span>Full name</span>
              <input
                type="text"
                value={form.name}
                onChange={update('name')}
                autoComplete="name"
                placeholder="Ananya Rao"
                aria-invalid={Boolean(fieldErrors.name)}
                required
                autoFocus
              />
            </label>
            <label className="auth-field">
              <span>Email address</span>
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(fieldErrors.email)}
                required
              />
            </label>
            <label className="auth-field">
              <span>Password</span>
              <span className="auth-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={update('password')}
                  autoComplete="new-password"
                  placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                  aria-invalid={Boolean(fieldErrors.password)}
                  required
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </span>
            </label>
            <div className="auth-field-row">
              <label className="auth-field">
                <span>Phone <em>optional</em></span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={update('phone')}
                  autoComplete="tel"
                  placeholder="+91 90000 00000"
                  aria-invalid={Boolean(fieldErrors.phone)}
                />
              </label>
              <label className="auth-field">
                <span>City <em>optional</em></span>
                <input
                  type="text"
                  value={form.city}
                  onChange={update('city')}
                  autoComplete="address-level2"
                  placeholder="Bengaluru"
                  aria-invalid={Boolean(fieldErrors.city)}
                />
              </label>
            </div>
            {message ? <p className="auth-error" role="alert">{message}</p> : null}
            <button type="submit" className="button button--dark button--full" disabled={isPending}>
              {isPending ? 'Creating your account…' : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/store/login">Sign in</Link>
          </p>

          <Link to="/store/shop" className="auth-back-link">← Continue shopping without signing in</Link>
        </section>
      </div>
    </div>
  )
}
