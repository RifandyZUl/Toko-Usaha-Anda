import { Component } from 'react'
import Button from './Button.jsx'
import Icon from './Icon.jsx'

/**
 * Error Boundary Component untuk menangkap error di React component tree
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    try {
      // Clear potentially corrupted session/auth storage to reset clean state
      localStorage.removeItem('toko-auth-storage')
      sessionStorage.clear()
    } catch (e) {
      console.warn('Could not reset storage:', e)
    }
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8 md:p-10">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <Icon name="AlertCircle" size={40} className="text-red-600" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gray-900 text-center mb-4">
              Oops! Terjadi Kesalahan
            </h1>

            <p className="text-body-md text-gray-600 text-center mb-6 font-body">
              Maaf, terjadi kesalahan yang tidak terduga. Silakan coba refresh halaman atau hubungi kami jika masalah
              berlanjut.
            </p>

            {this.state.error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left text-xs font-mono text-red-800 overflow-auto max-h-56">
                <p className="font-bold text-red-900 mb-1">Detail Error:</p>
                <p className="break-all">{this.state.error?.message || String(this.state.error)}</p>
                {this.state.errorInfo?.componentStack && (
                  <details className="mt-2 text-[11px] text-gray-700">
                    <summary className="cursor-pointer text-red-700 font-semibold">Stack Trace Komponen</summary>
                    <pre className="mt-1 whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Button variant="primary" onClick={this.handleReset}>
                <Icon name="RefreshCw" size={18} />
                Refresh Halaman
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = '/')}>
                <Icon name="Home" size={18} />
                Kembali ke Beranda
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

