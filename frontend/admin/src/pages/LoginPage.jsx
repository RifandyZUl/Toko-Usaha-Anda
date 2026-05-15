/**
 * Login Page
 * Modern admin authentication page with elegant design
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { Lock, Mail, ArrowRight } from 'lucide-react'
import ErrorMessage from '../components/common/ErrorMessage'
import { isValidEmail, minLength } from '../utils/validation'
import { ROUTES } from '../constants/routes'

export default function LoginPage() {
  const navigate = useNavigate()
  const authStore = useAuthStore()
  const { login, isAuthenticated, isAdmin, error, isLoading, user } = authStore
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [localError, setLocalError] = useState(null)
  const [focusedField, setFocusedField] = useState(null)

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated() && isAdmin()) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, isAdmin, navigate])

  // Watch for auth state changes after login
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  /**
   * Validate form data
   * @returns {boolean} True if valid
   */
  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setLocalError('Email dan password harus diisi')
      return false
    }

    if (!isValidEmail(formData.email)) {
      setLocalError('Format email tidak valid')
      return false
    }

    if (!minLength(formData.password, 6)) {
      setLocalError('Password minimal 6 karakter')
      return false
    }

    return true
  }

  /**
   * Handle form submission
   * @param {React.FormEvent} e - Form event
   */
  const handleSubmit = async e => {
    e.preventDefault()
    setLocalError(null)

    // Validate form
    if (!validateForm()) {
      return
    }

    // Attempt login
    const result = await login(formData.email, formData.password)

    if (result.success) {
      // Wait for state to be persisted
      await new Promise(resolve => setTimeout(resolve, 300))

      // Verify auth state before navigating
      const currentState = authStore
      if (currentState.isAuthenticated() && currentState.isAdmin()) {
        navigate(ROUTES.DASHBOARD, { replace: true })
      } else {
        // Fallback: force navigation
        window.location.href = ROUTES.DASHBOARD
      }
    } else {
      setLocalError(result.error || 'Login gagal')
    }
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 px-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gray-700/30 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-600/20 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gray-700/25 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 md:p-8">
          {/* Header with logo */}
          <div className="text-center mb-6">

            <h1 className="text-2xl font-heading font-bold text-white mb-2 tracking-tight">
              Admin Panel
            </h1>
            <p className="text-gray-300 text-xs font-medium">Masuk ke dashboard administrasi</p>
          </div>

          {/* Error Message */}
          {displayError && (
            <div className="mb-4">
              <ErrorMessage
                message={displayError}
                onDismiss={() => {
                  setLocalError(null)
                }}
              />
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold text-white/90">
                Email
              </label>
              <div className="relative group">
                <div
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-200 ${
                    focusedField === 'email' ? 'text-emerald-400 scale-110' : 'text-gray-400'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white/15 transition-all duration-200 font-medium"
                  placeholder="Masukkan email Anda"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-semibold text-white/90">
                Password
              </label>
              <div className="relative group">
                <div
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-all duration-200 ${
                    focusedField === 'password' ? 'text-emerald-400 scale-110' : 'text-gray-400'
                  }`}
                >
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg text-white placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 focus:bg-white/15 transition-all duration-200 font-medium"
                  placeholder="Masukkan password Anda"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-3 px-4 text-sm rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
            </button>
          </form>

          {/* Security Note */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-center text-xs text-gray-400">
              🔒 Akses terbatas untuk administrator
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}
