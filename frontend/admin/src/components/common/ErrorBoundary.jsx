/**
 * Error Boundary Component
 * Catches React errors and displays a fallback UI
 */

import { Component } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { ROUTES } from '../../constants/routes'

/**
 * Error Boundary Class Component
 * Note: Error boundaries must be class components
 */
class ErrorBoundaryClass extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error Boundary caught an error:', error, errorInfo)
    }

    this.setState({
      error,
      errorInfo,
    })

    // Here you could also log the error to an error reporting service
    // Example: logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          onGoHome={() => {
            this.handleReset()
            window.location.href = ROUTES.DASHBOARD
          }}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Error Fallback UI Component
 */
function ErrorFallback({ error, errorInfo, onReset, onGoHome }) {

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-red-100 rounded-full p-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Terjadi Kesalahan
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi atau kembali ke dashboard.
        </p>

        {import.meta.env.DEV && error && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <p className="text-sm font-semibold text-gray-900 mb-2">Error Details (Development):</p>
            <p className="text-xs text-red-600 font-mono break-all mb-2">
              {error.toString()}
            </p>
            {errorInfo && (
              <details className="text-xs text-gray-600">
                <summary className="cursor-pointer mb-2">Stack Trace</summary>
                <pre className="overflow-auto max-h-40 text-xs">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </button>
          <button
            onClick={onGoHome}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <Home className="h-4 w-4" />
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default ErrorBoundaryClass

