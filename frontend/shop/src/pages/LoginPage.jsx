import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@shared/components'
import Icon from '@shared/components/Icon.jsx'
import { useAuthStore } from '../stores/authStore'
import Loading from '../components/Loading'

/**
 * Login Page - Elegant design
 */
function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isLoading, error, user } = useAuthStore()
  const isAuthenticated = !!user
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/shop'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setFormError('')
  }

  const validateForm = () => {
    if (!formData.email.trim()) {
      setFormError('Email harus diisi')
      return false
    }
    if (!formData.email.includes('@')) {
      setFormError('Email tidak valid')
      return false
    }
    if (!formData.password) {
      setFormError('Password harus diisi')
      return false
    }
    if (formData.password.length < 6) {
      setFormError('Password minimal 6 karakter')
      return false
    }
    return true
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setFormError('')

    if (!validateForm()) {
      return
    }

    const result = await login(formData.email, formData.password)

    if (result.success) {
      const from = location.state?.from?.pathname || '/shop'
      navigate(from, { replace: true })
    } else {
      if (result.errors && result.errors.length > 0) {
        setFormError(result.errors[0].message)
      } else {
        setFormError(result.error || 'Login gagal')
      }
    }
  }

  if (isAuthenticated) {
    return <Loading message="Redirecting..." />
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white p-10">
          {/* Header */}
          <div className="text-center mb-10">
            <Link to="/" className="inline-block mb-6">
              <h1 className="text-xl font-heading font-semibold tracking-tight text-gray-900">
                TOKO USAHA ANDA
              </h1>
            </Link>
            <h2 className="text-2xl font-heading font-medium text-gray-900 mb-2">
              Sign In
            </h2>
            <p className="text-sm font-body text-gray-600">
              Welcome back. Please sign in to continue.
            </p>
          </div>

          {/* Error Message */}
          {(error || formError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 text-red-600">
                <Icon name="AlertCircle" size={18} />
                <p className="text-xs font-medium">{formError || error}</p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                placeholder="your@email.com"
                required
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="sm"
              disabled={isLoading}
              className="uppercase tracking-wider text-xs px-4 py-1.5"
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-sm font-body text-gray-600">
              Don&apos;t have an account?{' '}
              <Link
                to="/shop/register"
                className="text-gray-900 hover:text-gray-600 font-medium underline underline-offset-2"
              >
                Create Account
              </Link>
            </p>
          </div>

          {/* Back to Shop */}
          <div className="mt-6 text-center">
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-sm font-body text-gray-600 hover:text-gray-900 uppercase tracking-wider transition-colors"
            >
              <Icon name="ChevronDown" size={16} className="rotate-90" />
              Back to Shop
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
