import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children }) {
  const user = useAuthStore(state => state.user)
  const location = useLocation()

  // Strictly require active user object
  if (!user) {
    return <Navigate to="/shop/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute

