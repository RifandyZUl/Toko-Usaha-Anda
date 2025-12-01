import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@shared/components'
import Icon from '@shared/components/Icon.jsx'
import { useAuthStore } from '../stores/authStore'
import Loading from '../components/Loading'

/**
 * Register Page - Elegant design
 */
function RegisterPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { register, isLoading, error, isAuthenticated } = useAuthStore()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (isAuthenticated()) {
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
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setFormError('Name must be at least 2 characters')
      return false
    }
    if (!formData.email.trim()) {
      setFormError('Email is required')
      return false
    }
    if (!formData.email.includes('@')) {
      setFormError('Invalid email format')
      return false
    }
    if (!formData.password) {
      setFormError('Password is required')
      return false
    }
    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match')
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

    const result = await register({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim() || undefined,
      password: formData.password,
    })

    if (result.success) {
      const from = location.state?.from?.pathname || '/shop'
      navigate(from, { replace: true })
    } else {
      setFormError(result.error || 'Registration failed')
    }
  }

  if (isAuthenticated()) {
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
              Create Account
            </h2>
            <p className="text-sm font-body text-gray-600">
              Join us and start shopping
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

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                placeholder="Your full name"
                required
                disabled={isLoading}
              />
            </div>

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

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
                Phone <span className="normal-case font-normal text-gray-500">(Optional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                placeholder="081234567890"
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
                placeholder="Min. 6 characters"
                required
                disabled={isLoading}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-body font-medium text-gray-900 mb-2 uppercase tracking-wider">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                placeholder="Re-enter password"
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
              className="uppercase tracking-wider text-xs px-4 py-1.5 mt-6"
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={16} className="animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-sm font-body text-gray-600">
              Already have an account?{' '}
              <Link
                to="/shop/login"
                className="text-gray-900 hover:text-gray-600 font-medium underline underline-offset-2"
              >
                Sign In
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

export default RegisterPage
