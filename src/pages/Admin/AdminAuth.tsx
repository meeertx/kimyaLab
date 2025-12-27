import React, { useState, Suspense } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSuccessNotification, useErrorNotification } from '../../components/NotificationSystem/NotificationSystem'
import Molecules3D from '../../components/Molecules3D/Molecules3D'

const AdminAuth: React.FC = () => {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()
  
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  
  const showSuccessNotification = useSuccessNotification()
  const showErrorNotification = useErrorNotification()

  // ✅ FIXED: Doğru admin credentials
  const demoCredentials = {
    email: 'admin@kimyalab.com',
    password: 'admin123!' // Seed ile eşleşen doğru şifre
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (isLogin) {
        await signIn(formData.email, formData.password)
        
        showSuccessNotification(
          'Admin Girişi Başarılı! 🧪',
          'KimyaLab Yönetim Paneline yönlendiriliyorsunuz...',
          3000
        )
        
        setTimeout(() => {
          navigate('/admin/dashboard')
        }, 1000)
        
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Şifreler eşleşmiyor!')
        }
        
        await signUp(formData.email, formData.password, formData.displayName)
        
        showSuccessNotification(
          'Admin Hesabı Oluşturuldu! 🎉',
          'Hesabınız başarıyla oluşturuldu. Şimdi giriş yapabilirsiniz.',
          4000
        )
        
        setIsLogin(true)
        setFormData({ email: '', password: '', displayName: '', confirmPassword: '' })
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      
      showErrorNotification(
        `${isLogin ? 'Giriş' : 'Hesap Oluşturma'} Hatası`,
        error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.',
        {
          label: 'Tekrar Dene',
          handler: () => handleSubmit(e)
        }
      )
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setFormData({ email: '', password: '', displayName: '', confirmPassword: '' })
  }

  const fillDemoData = () => {
    setFormData(prev => ({
      ...prev,
      email: demoCredentials.email,
      password: demoCredentials.password
    }))
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* 3D Background with Professional Chemistry Theme */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={
          <div className="absolute inset-0 bg-gradient-to-br from-scientific-blue-900 via-primary-800 to-scientific-green-900 flex items-center justify-center">
            <div className="text-6xl animate-spin">🧪</div>
          </div>
        }>
          <Molecules3D height="100vh" className="opacity-20" />
        </Suspense>
      </div>
      
      {/* Glass-morphism Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-scientific-blue-900/85 via-primary-800/90 to-scientific-green-900/85"></div>

      {/* Main Content */}
      <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Professional Chemistry Glass Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Header with Professional Chemistry Theme */}
            <div className="bg-gradient-to-r from-scientific-blue-600/80 via-primary-600/80 to-scientific-green-600/80 px-8 py-8 text-center relative">
              <div className="absolute top-2 right-4 text-2xl opacity-30 animate-spin" style={{ animationDuration: '20s' }}>🧬</div>
              
              <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/30">
                <span className="text-4xl">🧪</span>
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
                {isLogin ? 'Admin Panel' : 'Yeni Admin'}
              </h1>
              <p className="text-white/80 text-lg font-medium">
                {isLogin ? 'KimyaLab Yönetim Sistemi' : 'Admin Hesabı Oluştur'}
              </p>
            </div>

            {/* Form Container */}
            <div className="p-8 space-y-6">
              {/* Demo Credentials with Chemistry Theme */}
              {isLogin && (
                <div className="p-5 bg-gradient-to-r from-scientific-blue-500/20 via-primary-500/20 to-scientific-green-500/20 rounded-2xl border border-scientific-blue-300/30">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white/90 mb-3 flex items-center justify-center gap-2">
                      <span className="text-lg">🔑</span>
                      <span>Demo Giriş Bilgileri</span>
                    </p>
                    <div className="text-sm text-white/80 space-y-2 bg-black/20 rounded-xl p-3">
                      <p className="font-mono">📧 {demoCredentials.email}</p>
                      <p className="font-mono">🔒 {demoCredentials.password}</p>
                    </div>
                    <button
                      onClick={fillDemoData}
                      className="mt-4 text-sm bg-scientific-blue-500/80 hover:bg-scientific-blue-600/80 text-white font-medium px-4 py-2 rounded-xl transition-all duration-300"
                    >
                      ⚡ Demo Bilgileri Doldur
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Display Name - Registration only */}
                {!isLogin && (
                  <div className="relative">
                    <input
                      type="text"
                      name="displayName"
                      placeholder="Ad Soyad"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      required={!isLogin}
                      className="w-full px-4 py-4 pl-14 bg-white/20 border-2 border-white/30 rounded-2xl focus:border-scientific-blue-400 focus:bg-white/30 text-white placeholder-white/60 transition-all duration-300 outline-none font-medium"
                    />
                    <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white/70">
                      <span className="text-xl">👤</span>
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    placeholder="Admin E-posta"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-4 pl-14 bg-white/20 border-2 border-white/30 rounded-2xl focus:border-scientific-blue-400 focus:bg-white/30 text-white placeholder-white/60 transition-all duration-300 outline-none font-medium"
                  />
                  <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white/70">
                    <span className="text-xl">📧</span>
                  </div>
                </div>

                {/* Password */}
                <div className="relative">
                  <input
                    type="password"
                    name="password"
                    placeholder="Şifre"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-4 pl-14 bg-white/20 border-2 border-white/30 rounded-2xl focus:border-scientific-blue-400 focus:bg-white/30 text-white placeholder-white/60 transition-all duration-300 outline-none font-medium"
                  />
                  <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white/70">
                    <span className="text-xl">🔒</span>
                  </div>
                </div>

                {/* Confirm Password - Registration only */}
                {!isLogin && (
                  <div className="relative">
                    <input
                      type="password"
                      name="confirmPassword"
                      placeholder="Şifre Tekrar"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required={!isLogin}
                      className="w-full px-4 py-4 pl-14 bg-white/20 border-2 border-white/30 rounded-2xl focus:border-scientific-blue-400 focus:bg-white/30 text-white placeholder-white/60 transition-all duration-300 outline-none font-medium"
                    />
                    <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white/70">
                      <span className="text-xl">🔐</span>
                    </div>
                  </div>
                )}

                {/* Submit Button with Professional Chemistry Gradient */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-scientific-blue-500 via-primary-600 to-scientific-green-500 hover:from-scientific-blue-600 hover:via-primary-700 hover:to-scientific-green-600 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl border border-white/20 text-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-3">
                      <div className="rounded-full h-6 w-6 border-b-2 border-white animate-spin"></div>
                      <span>İşleniyor...</span>
                    </div>
                  ) : (
                    <span>{isLogin ? '🚀 Admin Paneline Giriş' : '✨ Hesap Oluştur'}</span>
                  )}
                </button>
              </form>

              {/* Toggle Mode */}
              <div className="text-center">
                <button
                  onClick={toggleMode}
                  className="text-white/80 hover:text-white font-medium transition-colors duration-300 underline decoration-dotted underline-offset-4 hover:decoration-solid"
                >
                  {isLogin ? 
                    '➕ Yeni admin hesabı oluştur' : 
                    '🔑 Mevcut hesabımla giriş yap'
                  }
                </button>
              </div>

              {/* Back to Home */}
              <div className="text-center">
                <Link
                  to="/"
                  className="text-white/60 hover:text-white/80 text-sm transition-colors duration-300 flex items-center justify-center space-x-2 font-medium"
                >
                  <span>←</span>
                  <span>Ana Sayfaya Dön</span>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Professional Chemistry Footer */}
          <div className="text-center mt-8 text-white/50 text-sm font-medium">
            <p className="flex items-center justify-center gap-2">
              <span>🧪</span>
              <span>© 2024 KimyaLab - Güvenli Yönetim Paneli</span>
              <span>🔬</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminAuth