import { Component, ReactNode } from 'react'
import { motion } from 'framer-motion'

interface Props {
  children: ReactNode
  fallbackComponent?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorId: string
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 Error Boundary Caught:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })

    // Send to monitoring service
    this.reportError(error, errorInfo)

    // Call onError prop if provided
    this.props.onError?.(error, errorInfo)
  }

  reportError = async (error: Error, errorInfo: any) => {
    try {
      // Here you would send to your monitoring service
      // Example: Sentry, LogRocket, or custom endpoint
      
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        // Add more context as needed
        formData: this.getFormDataFromSession(),
        userActions: this.getUserActionsFromSession()
      }

      // For now, just log to console (replace with actual service)
      console.log('📊 Error Report:', errorReport)
      
      // Example: await fetch('/api/errors', { method: 'POST', body: JSON.stringify(errorReport) })
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  getFormDataFromSession = () => {
    try {
      return sessionStorage.getItem('currentFormData') || null
    } catch {
      return null
    }
  }

  getUserActionsFromSession = () => {
    try {
      return JSON.parse(sessionStorage.getItem('userActions') || '[]')
    } catch {
      return []
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent
      }

      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4"
        >
          <div className="max-w-md w-full">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-xl p-8 text-center"
            >
              <div className="text-6xl mb-4">🚨</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Bir şeyler yanlış gitti
              </h1>
              <p className="text-gray-600 mb-6">
                Beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin veya tekrar deneyin.
              </p>
              
              <div className="space-y-3 mb-6">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-scientific-blue-500 text-white py-3 rounded-lg hover:bg-scientific-blue-600 transition-colors"
                >
                  🔄 Tekrar Dene
                </button>
                <button
                  onClick={this.handleReload}
                  className="w-full bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  🔃 Sayfayı Yenile
                </button>
              </div>

              <details className="text-left bg-gray-50 rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  Teknik Detaylar (Geliştiriciler için)
                </summary>
                <div className="text-xs font-mono text-gray-600 space-y-2">
                  <div><strong>Error ID:</strong> {this.state.errorId}</div>
                  <div><strong>Message:</strong> {this.state.error?.message}</div>
                  <div><strong>Timestamp:</strong> {new Date().toLocaleString('tr-TR')}</div>
                  {this.state.error?.stack && (
                    <div className="max-h-32 overflow-auto bg-gray-100 p-2 rounded">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            </motion.div>
          </div>
        </motion.div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary