import React, { useState, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSEO } from '../hooks/useSEO'
import { useSuccessNotification, useErrorNotification } from '../components/NotificationSystem/NotificationSystem'

// Components
import Molecules3D from '../components/Molecules3D/Molecules3D'

const Auth: React.FC = () => {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  })

  // Parallax effects
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"])
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.4])

  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signUp, loading, user } = useAuth()
  const showSuccessNotification = useSuccessNotification()
  const showErrorNotification = useErrorNotification()

  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Floating animation variants for molecules
  const moleculeFloatingVariants = {
    animate: {
      y: [0, -20, 0],
      x: [0, 8, -8, 0],
      rotate: [0, 3, -3, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  // Redirect path after login
  const from = (location.state as any)?.from?.pathname || '/'

  // SEO
  useSEO({
    title: isLogin ? t('auth.login_button') : t('auth.join_us'),
    description: isLogin ?
      'Kimyalab hesabınıza giriş yapın ve özel içeriklere erişin.' :
      'Kimyalab\'a üye olun ve bilimsel dünyamızın bir parçası olun.',
    keywords: ['kimyalab', 'giriş', 'üye ol', 'hesap', 'login', 'register'],
    type: 'website'
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.email) {
      newErrors.email = t('auth.email_required')
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t('auth.email_invalid')
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t('auth.password_required')
    } else if (formData.password.length < 6) {
      newErrors.password = t('auth.password_min')
    }

    // Registration specific validations
    if (!isLogin) {
      if (!formData.displayName) {
        newErrors.displayName = t('auth.name_required')
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = t('auth.password_confirm_required')
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t('auth.password_mismatch')
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      if (isLogin) {
        await signIn(formData.email, formData.password)
        showSuccessNotification(
          'Giriş Başarılı!',
          'KimyaLab hesabınıza başarıyla giriş yaptınız.',
          2000
        )
        
        // Wait for notification to show, then redirect
        setTimeout(() => {
          // Check if user is admin - if so, redirect to admin dashboard
          const userData = user || JSON.parse(localStorage.getItem('userData') || '{}')
          if (userData.role === 'ADMIN') {
            navigate('/admin', { replace: true })
          } else {
            // For regular users, go to home page
            navigate(from === '/auth' ? '/' : from, { replace: true })
          }
        }, 2200) // Wait a bit longer than notification duration
        
      } else {
        await signUp(formData.email, formData.password, formData.displayName)
        showSuccessNotification(
          'Hesap Oluşturuldu! 🎉',
          `Hoş geldiniz ${formData.displayName}! KimyaLab hesabınız başarıyla oluşturuldu.`,
          3000
        )
        
        // Wait for notification, then redirect to home page
        setTimeout(() => {
          navigate('/', { replace: true })
        }, 3200)
      }
    } catch (error: any) {
      showErrorNotification(
        isLogin ? 'Giriş Hatası' : 'Kayıt Hatası',
        error.message || 'Beklenmedik bir hata oluştu.',
        {
          label: 'Tekrar Dene',
          handler: () => setErrors({})
        }
      )
      setErrors({ submit: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSignIn = async () => {
    // Google Sign In temporarily disabled - PostgreSQL backend doesn't support it yet
    setErrors({ submit: 'Google Sign In is not available yet. Please use email/password.' })
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setFormData({ email: '', password: '', displayName: '', confirmPassword: '' })
    setErrors({})
  }

  return (
    <div ref={ref} className="relative min-h-screen pt-20 pb-12 flex items-center justify-center overflow-hidden">
      
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-scientific-blue-50 to-scientific-green-50" />
      
      {/* 3D Molecules Background */}
      <motion.div
        style={{ y, opacity }}
        className="absolute inset-0 opacity-20"
      >
        <Molecules3D height="150vh" />
      </motion.div>
      
      {/* Additional floating CSS molecules for layered effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Small CSS molecules for extra particles - lighter for auth page */}
        <motion.div
          variants={moleculeFloatingVariants}
          animate="animate"
          className="absolute top-20 right-20 w-12 h-12 opacity-8"
        >
          <div className="relative">
            <div className="w-2 h-2 bg-scientific-blue-300 rounded-full absolute top-0 left-0 animate-pulse" />
            <div className="w-2 h-2 bg-scientific-green-300 rounded-full absolute top-2 left-2 animate-pulse animation-delay-200" />
            <div className="absolute top-1 left-1 w-2 h-0.5 bg-gradient-to-r from-scientific-blue-300 to-scientific-green-300 rotate-45 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          variants={moleculeFloatingVariants}
          animate="animate"
          className="absolute bottom-32 left-16 w-10 h-10 opacity-10"
          style={{ animationDelay: '2s' }}
        >
          <div className="relative">
            <div className="w-2 h-2 bg-accent-lavender-300 rounded-full absolute top-0 left-0 animate-pulse" />
            <div className="w-2 h-2 bg-accent-pink-300 rounded-full absolute top-2 left-2 animate-pulse animation-delay-300" />
            <div className="absolute top-1 left-1 w-1 h-0.5 bg-gradient-to-r from-accent-lavender-300 to-accent-pink-300 -rotate-30 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          variants={moleculeFloatingVariants}
          animate="animate"
          className="absolute top-40 left-20 w-8 h-8 opacity-6"
          style={{ animationDelay: '4s' }}
        >
          <div className="relative">
            <div className="w-1 h-1 bg-accent-gold-300 rounded-full absolute top-0 left-1 animate-pulse" />
            <div className="w-2 h-2 bg-yellow-300 rounded-full absolute top-1 left-2 animate-pulse animation-delay-400" />
            <div className="absolute top-1 left-1 w-1 h-0.5 bg-gradient-to-r from-accent-gold-300 to-yellow-300 rotate-60 opacity-50" />
          </div>
        </motion.div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md mx-auto p-6"
      >
        <div className="card-3d p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl font-bold text-gradient mb-2"
            >
              {isLogin ? t('auth.welcome') : t('auth.join_us')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-primary-600"
            >
              {isLogin ? t('auth.login_subtitle') : t('auth.register_subtitle')}
            </motion.p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {errors.submit && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
              >
                {errors.submit}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Google Sign In */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            onClick={handleGoogleSignIn}
            disabled={isSubmitting || loading}
            className="w-full mb-6 py-3 px-4 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors duration-300 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-gray-700 font-medium">{isLogin ? t('auth.google_login') : t('auth.google_register')}</span>
          </motion.button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">{t('auth.or')}</span>
            </div>
          </div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Display Name - only for registration */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <input
                    type="text"
                    name="displayName"
                    placeholder={t('auth.full_name')}
                    value={formData.displayName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.displayName ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-scientific-blue-500/20 focus:border-scientific-blue-500 transition-colors duration-300`}
                  />
                  {errors.displayName && (
                    <p className="mt-1 text-sm text-red-600">{errors.displayName}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <input
                type="email"
                name="email"
                placeholder={t('auth.email')}
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-scientific-blue-500/20 focus:border-scientific-blue-500 transition-colors duration-300`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <input
                type="password"
                name="password"
                placeholder={t('auth.password')}
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-scientific-blue-500/20 focus:border-scientific-blue-500 transition-colors duration-300`}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password - only for registration */}
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder={t('auth.password_confirm')}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-scientific-blue-500/20 focus:border-scientific-blue-500 transition-colors duration-300`}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{t('auth.processing')}</span>
                </div>
              ) : (
                isLogin ? t('auth.login_button') : t('auth.register_button')
              )}
            </motion.button>
          </motion.form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <button
              onClick={toggleMode}
              className="text-scientific-blue-600 hover:text-scientific-blue-700 transition-colors duration-300"
            >
              {isLogin ? t('auth.no_account') : t('auth.have_account')}
            </button>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <Link
              to="/"
              className="text-primary-500 hover:text-primary-600 transition-colors duration-300 text-sm"
            >
              {t('auth.back_home')}
            </Link>
          </div>
        </div>
        </motion.div>
    </div>
  )
}

export default Auth