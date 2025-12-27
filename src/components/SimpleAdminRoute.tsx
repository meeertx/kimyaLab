import React, { useState, Suspense, useEffect } from 'react'
import { motion } from 'framer-motion'
import Molecules3D from './Molecules3D/Molecules3D'
import { AuthApi } from '../services/api/authApi'
import { apiClient } from '../services/api/apiClient'

interface SimpleAdminRouteProps {
  children: React.ReactNode
}

const SimpleAdminRoute: React.FC<SimpleAdminRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (token && AuthApi.isAdmin()) {
          apiClient.setToken(token)
          // Verify token is still valid
          await AuthApi.getProfile()
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.log('Token invalid, need to login')
        localStorage.removeItem('accessToken')
      } finally {
        setInitialLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      // Real API authentication
      const authUser = await AuthApi.login({ email, password })
      
      // Check if user is admin
      if (authUser.role !== 'ADMIN') {
        throw new Error('Bu hesap admin yetkisine sahip değil')
      }
      
      setIsAuthenticated(true)
      setError('')
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'Giriş yapılamadı. Bilgilerinizi kontrol edin.')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail('admin@kimyalab.com')
    setPassword('admin123!')
  }

  // Show loading spinner while checking auth
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-white mx-auto mb-4"></div>
          <p>Yetkilendirme kontrol ediliyor...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
        {/* 3D Molecules Background */}
        <div className="absolute inset-0 opacity-30">
          <Suspense fallback={null}>
            <Molecules3D />
          </Suspense>
        </div>
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/40" />
        
        {/* Login Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            {/* Glassmorphism Login Card */}
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-6"
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-lg">
                    <span className="text-3xl">🧪</span>
                  </div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Bilimsel İnovasyonun Merkezi
                  </h1>
                  <p className="text-blue-200 text-lg">
                    KimyaLab Admin Panel
                  </p>
                </motion.div>
              </div>

              {/* Demo Credentials Box */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 font-medium text-sm mb-1">🔑 Demo Admin Bilgileri</p>
                    <p className="text-blue-200 text-xs">📧 admin@kimyalab.com</p>
                    <p className="text-blue-200 text-xs">🔒 admin123!</p>
                  </div>
                  <button
                    type="button"
                    onClick={fillDemoCredentials}
                    className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors shadow-lg"
                  >
                    ⚡ Demo Bilgileri Doldur
                  </button>
                </div>
              </motion.div>

              {/* Login Form */}
              <form onSubmit={handleLogin}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-4 mb-6"
                >
                  <div>
                    <label className="block text-white font-medium mb-3">
                      Admin E-posta
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent backdrop-blur-sm transition-all"
                      placeholder="admin@kimyalab.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-white font-medium mb-3">
                      Admin Şifresi
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent backdrop-blur-sm transition-all"
                      placeholder="Şifrenizi girin..."
                      required
                    />
                  </div>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-300 text-sm p-3 bg-red-500/20 rounded-xl border border-red-400/30"
                    >
                      ❌ {error}
                    </motion.p>
                  )}
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-4 px-6 rounded-2xl font-semibold text-white transition-all shadow-xl ${
                    isLoading
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover:scale-[1.02] hover:shadow-2xl'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Giriş yapılıyor...
                    </div>
                  ) : (
                    <>🚀 Admin Paneline Giriş</>
                  )}
                </motion.button>
              </form>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8 text-center"
              >
                <p className="text-blue-200/60 text-sm">
                  Kimya ve Bilim Dünyasında Yenilikçi Çözümler
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default SimpleAdminRoute