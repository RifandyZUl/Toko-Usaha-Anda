/**
 * Main App Component
 * Sets up routing and authentication check
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './components/layout/AdminLayout'
import ErrorBoundary from './components/common/ErrorBoundary'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import OrdersPage from './pages/OrdersPage'
import { ROUTES } from './constants/routes'

function App() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    // Check authentication status on app mount
    checkAuth()
  }, [checkAuth])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />

          {/* Protected Admin Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            <Route path={ROUTES.PRODUCTS} element={<ProductsPage />} />
            <Route path={ROUTES.ORDERS} element={<OrdersPage />} />
            <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
