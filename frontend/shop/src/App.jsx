import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ShopPage from './pages/ShopPage'
import CategoryPage from './pages/CategoryPage'
import AllProductsPage from './pages/AllProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import OrderDetailPage from './pages/OrderDetailPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ErrorBoundary from '@shared/components/ErrorBoundary.jsx'
import { useAuthStore } from './stores/authStore'

/**
 * Shop App - E-Commerce Application
 */
function App() {
  const checkAuth = useAuthStore(state => state.checkAuth)

  useEffect(() => {
    checkAuth()

    // Sync auth state across multiple browser tabs
    const handleStorageChange = e => {
      if (e.key === 'toko-auth-storage') {
        checkAuth()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [checkAuth])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/category/:slug" element={<CategoryPage />} />
          <Route path="/shop/all" element={<AllProductsPage />} />
          <Route path="/shop/product/:id" element={<ProductDetailPage />} />
          <Route path="/shop/cart" element={<CartPage />} />
          <Route path="/shop/login" element={<LoginPage />} />
          <Route path="/shop/register" element={<RegisterPage />} />
          <Route
            path="/shop/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shop/order-success"
            element={
              <ProtectedRoute>
                <OrderSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shop/order/:id"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shop/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/shop" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
