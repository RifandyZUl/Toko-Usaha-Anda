/**
 * Protected Route Component
 * Wraps routes that require authentication and admin role
 * Redirects to login if user is not authenticated or not admin
 */

import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import Loading from './common/Loading'
import { ROUTES } from '../constants/routes'
import { logError } from '../utils/logger'

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isAdmin, checkAuth, user, token } = useAuthStore()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let isMounted = true

    const verifyAuth = async () => {
      try {
        // Quick check: if we have user and token, verify they're still valid
        if (user && token) {
          // Quick client-side check first
          if (isAuthenticated() && isAdmin()) {
            if (isMounted) {
              setIsChecking(false)
            }
            return
          }
        }

        // Verify with server
        await checkAuth()

        if (isMounted) {
          setIsChecking(false)
        }
      } catch (error) {
        logError('Auth verification error', error)
        if (isMounted) {
          setIsChecking(false)
        }
      }
    }

    verifyAuth()

    return () => {
      isMounted = false
    }
  }, [checkAuth, user, token, isAuthenticated, isAdmin])

  // Show loading state while checking authentication
  if (isChecking) {
    return <Loading message="Memverifikasi autentikasi..." />
  }

  // Redirect to login if not authenticated or not admin
  if (!isAuthenticated() || !isAdmin()) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  // Render protected content
  return <>{children}</>
}
