import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Loading from './Loading'

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()

  // Check if authenticated (will be reactive)
  if (isAuthenticated()) {
    return children
  }

  // Redirect to login with return path
  return <Navigate to="/shop/login" state={{ from: location }} replace />
}

export default ProtectedRoute

