/**
 * Protected Route Component
 * Wraps routes that require authentication and admin role
 * Redirects to login if user is not authenticated or not admin
 */

import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Loading from './common/Loading'
import { ROUTES } from '../constants/routes'
import { logError } from '../utils/logger'

/**
 * @param {Object} props
 * @param {React.ReactNode} [props.children] - Child components to render if authenticated
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isAdmin, checkAuth } = useAuthStore()
  const [isChecking, setIsChecking] = useState(() => !(isAuthenticated() && isAdmin()))

  useEffect(() => {
    let isMounted = true

    const verifyAuth = async () => {
      // If already authenticated and verified as admin, no need to block
      if (isAuthenticated() && isAdmin()) {
        if (isMounted) {
          setIsChecking(false)
        }
        return
      }

      try {
        await checkAuth()
      } catch (error) {
        logError('Auth verification error', error)
      } finally {
        if (isMounted) {
          setIsChecking(false)
        }
      }
    }

    verifyAuth()

    return () => {
      isMounted = false
    }
  }, [checkAuth, isAuthenticated, isAdmin])

  // Show loading state while checking authentication
  if (isChecking) {
    return <Loading message="Memverifikasi autentikasi..." />
  }

  // Redirect to login if not authenticated or not admin
  if (!isAuthenticated() || !isAdmin()) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  // Render protected content
  return children ? <>{children}</> : <Outlet />
}
