import { AuthProvider, useAuth } from './auth/AuthContext'
import Dashboard from './components/Dashboard/Dashboard'
import Login from './components/Login/Login'

function Gate() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <Dashboard /> : <Login />
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
