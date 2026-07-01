import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type User = { name: string; email: string }

type AuthState = {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

const STORAGE_KEY = 'brandsync.auth.user'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  })

  useEffect(() => {
    if (user) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else sessionStorage.removeItem(STORAGE_KEY)
  }, [user])

  async function login(email: string, password: string) {
    await new Promise((r) => setTimeout(r, 700))
    if (!EMAIL_RE.test(email)) throw new Error('Enter a valid email address.')
    if (password.length < 4) throw new Error('Password must be at least 4 characters.')
    const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    setUser({ name, email })
  }

  function logout() {
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
