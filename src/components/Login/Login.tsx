import { useState, type FormEvent } from 'react'
import { Eye, EyeSlash, WarningCircle, SignIn } from '@phosphor-icons/react'
import { useAuth } from '../../auth/AuthContext'
import './Login.css'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <aside className="login__brand" aria-hidden="true">
        <div className="login__brand-mark">BS</div>
        <div className="login__brand-copy">
          <h2>Welcome back</h2>
          <p>Sign in to your Brandsync workspace to manage your team, analytics and content.</p>
        </div>
        <div className="login__brand-orb login__brand-orb--a" />
        <div className="login__brand-orb login__brand-orb--b" />
      </aside>

      <main className="login__panel">
        <form className="login__form" onSubmit={onSubmit} noValidate>
          <header className="login__form-header">
            <h1>Sign in</h1>
            <p>Use your work email to access the dashboard.</p>
          </header>

          {error && (
            <div className="login__alert" role="alert">
              <WarningCircle size={18} weight="fill" />
              <span>{error}</span>
            </div>
          )}

          <div className="bs-input-wrapper">
            <label className="bs-input-label" htmlFor="login-email">
              Email <span aria-hidden="true">*</span>
            </label>
            <div className="bs-input-container">
              <input
                id="login-email"
                className="bs-input-field"
                type="email"
                autoComplete="email"
                placeholder="you@brandsync.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="bs-input-wrapper">
            <div className="login__label-row">
              <label className="bs-input-label" htmlFor="login-password">
                Password <span aria-hidden="true">*</span>
              </label>
              <a href="#" className="login__link login__link--sm" onClick={(e) => e.preventDefault()}>
                Forgot password?
              </a>
            </div>
            <div className="bs-input-container">
              <input
                id="login-password"
                className="bs-input-field"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="login__icon-btn"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <label className="bs-checkbox bs-checkbox--md login__remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              disabled={loading}
            />
            <span className="bs-checkbox__box">
              <svg className="bs-icon-check" viewBox="0 0 14 14" fill="none">
                <path
                  d="M2 7l3.5 3.5L12 3"
                  stroke="var(--bs-color-primary-default)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Remember me on this device
          </label>

          <button
            type="submit"
            className="bs-btn bs-btn-primary login__submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="login__spinner" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              <>
                <SignIn size={18} weight="bold" />
                Sign in
              </>
            )}
          </button>

          <p className="login__footnote">
            Don't have an account?{' '}
            <a href="#" className="login__link" onClick={(e) => e.preventDefault()}>
              Request access
            </a>
          </p>
        </form>
      </main>
    </div>
  )
}
