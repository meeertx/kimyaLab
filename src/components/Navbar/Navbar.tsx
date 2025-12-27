import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { availableLanguages } from '../../i18n/config'
import { useAuth } from '../../contexts/AuthContext'
import MegaMenu from '../MegaMenu/MegaMenu'
import { ProductService } from '../../services/productService'
import { Product } from '../../types'

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { user, signOut, loading } = useAuth()
  const navigate = useNavigate()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false)
  const [megaMenuHoverTimeout, setMegaMenuHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  
  // Global Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Navigation items
  const navigationItems = [
    { key: 'home', href: '/' },
    { key: 'about', href: '/hakkimizda' },
    { key: 'services', href: '/hizmetler' },
    { key: 'contact', href: '/iletisim' }
  ]

  // Language change handler
  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode)
    setIsLanguageDropdownOpen(false)
    setIsMobileMenuOpen(false)
  }

  // Get current language display name
  const getCurrentLanguageDisplay = () => {
    return availableLanguages[i18n.language as keyof typeof availableLanguages] || 'Türkçe'
  }

  // Get language flag emoji
  const getLanguageFlag = (langCode: string) => {
    const flags = {
      tr: '🇹🇷',
      en: '🇺🇸', 
      ar: '🇸🇦'
    }
    return flags[langCode as keyof typeof flags] || '🇹🇷'
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setIsUserDropdownOpen(false)
      setIsMobileMenuOpen(false)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Mega menu handlers - Hover + Click
  const handleMegaMenuToggle = () => {
    setIsMegaMenuOpen(!isMegaMenuOpen)
  }

  const handleMegaMenuClose = () => {
    setIsMegaMenuOpen(false)
  }

  // Handle products link click (navigate to products page)
  const handleProductsLinkClick = () => {
    navigate('/urunler')
    setIsMegaMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Simple arrow click handler
  const handleArrowClick = () => {
    setIsMegaMenuOpen(!isMegaMenuOpen)
  }

  // Close mega menu when mobile menu is opened
  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMegaMenuOpen(false)
    }
  }, [isMobileMenuOpen])

  // Detect mobile screen
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Global search functionality
  const performGlobalSearch = async (query: string): Promise<Product[]> => {
    try {
      if (!query.trim()) return []
      const results = await ProductService.searchProducts(query)
      return results.slice(0, 5) // Top 5 results for dropdown
    } catch (error) {
      console.error('Global search error:', error)
      return []
    }
  }

  // Debounced search effect
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      console.log('🔍 Frontend search starting:', searchQuery)
      setIsSearching(true)
      const timeoutId = setTimeout(async () => {
        try {
          console.log('🔄 Frontend calling performGlobalSearch:', searchQuery)
          const results = await performGlobalSearch(searchQuery)
          console.log('✅ Frontend search results received:', results)
          console.log('📊 Frontend search results count:', results?.length || 0)
          console.log('🔍 Frontend search results preview:', results?.slice(0, 2))
          
          setSearchResults(results)
          setShowSearchDropdown(results.length > 0)
          
          console.log('🎯 Frontend dropdown state set:', results.length > 0)
        } catch (error) {
          console.error('❌ Frontend search error:', error)
          setSearchResults([])
          setShowSearchDropdown(false)
        } finally {
          setIsSearching(false)
        }
      }, 300)

      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
      setShowSearchDropdown(false)
      setIsSearching(false)
    }
  }, [searchQuery])

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/arama?q=${encodeURIComponent(searchQuery.trim())}`)
      setShowSearchDropdown(false)
      setSearchQuery('')
    }
  }

  // Handle product click from search dropdown
  const handleProductClick = (productId: string) => {
    navigate(`/urun/${productId}`)
    setShowSearchDropdown(false)
    setSearchQuery('')
  }

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass-nav scrolled' : 'glass-nav'
      }`}
    >
      <div className="container-responsive">
        <div className="flex items-center justify-between h-16 lg:h-20">
          
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex items-center space-x-3"
          >
            <Link
              to="/"
              className="flex items-center space-x-3 hover:scale-105 transition-transform duration-300"
              onClick={() => {
                setIsMobileMenuOpen(false)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-scientific-blue-500 to-scientific-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">K</span>
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-scientific-blue-500 to-scientific-green-500 rounded-xl blur-sm opacity-30 animate-pulse"></div>
              </div>
              <div className="font-bold text-xl text-gradient">
                Kimyalab
              </div>
            </Link>
          </motion.div>

            {/* Global Search Bar - Desktop */}
            <div className="hidden lg:flex items-center justify-center flex-1 max-w-md mx-6" ref={searchContainerRef}>
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) {
                        setShowSearchDropdown(true)
                      }
                    }}
                    placeholder="Ürün, marka, CAS ara..."
                    className="w-full px-10 py-2.5 text-sm bg-white/80 backdrop-blur-sm border-2 border-white/30 rounded-xl focus:outline-none focus:border-scientific-blue-400 focus:bg-white/90 transition-all duration-300 placeholder-primary-400"
                  />
                  
                  {/* Search Icon */}
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>

                  {/* Loading Spinner */}
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="animate-spin h-4 w-4 text-scientific-blue-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {showSearchDropdown && searchResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl border border-white/30 py-2 z-50 max-h-80 overflow-y-auto"
                    >
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                        Arama Sonuçları
                      </div>
                      
                      {searchResults.map((product, index) => (
                        <motion.button
                          key={product.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleProductClick(product.id)}
                          className="w-full text-left px-3 py-3 hover:bg-gray-50 transition-colors duration-150"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">🧪</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate text-sm">
                                {product.name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {[
                                  product.brand && product.brand.trim(),
                                  product.cas && product.cas.trim(),
                                  product.formula && product.formula.trim(),
                                  product.productCode && `Kod: ${product.productCode}`
                                ].filter(Boolean).join(' • ') || 'Kimyasal Ürün'}
                              </div>
                              <div className="text-xs font-semibold text-scientific-blue-600">
                                {product.currency || '₺'}{product.price}
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                      
                      {/* View All Results Button */}
                      <motion.button
                        onClick={handleSearchSubmit}
                        className="w-full mt-2 px-3 py-2 text-white bg-gradient-to-r from-scientific-blue-500 to-scientific-blue-600 hover:from-scientific-blue-600 hover:to-scientific-blue-700 transition-all duration-200 text-sm font-semibold"
                      >
                        Tüm sonuçları gör ({searchQuery})
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
            {/* Home Link */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Link
                to="/"
                className="relative text-primary-700 hover:text-scientific-blue-600 font-medium transition-colors duration-300 group"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                {t('nav.home')}
                {/* Hover underline effect */}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-scientific-blue-500 to-scientific-green-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </motion.div>

            {/* Products Navigation - Simple Click + Arrow Hover */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative flex items-center"
            >
              {/* Products Text - Click to go to products page */}
              <button
                onClick={handleProductsLinkClick}
                className="relative text-primary-700 hover:text-scientific-blue-600 font-medium transition-colors duration-300 group"
              >
                <span>{t('nav.products')}</span>
                {/* Hover underline effect */}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-scientific-blue-500 to-scientific-green-500 transition-all duration-300 group-hover:w-full"></span>
              </button>
              
              {/* Arrow Icon - Click to toggle dropdown */}
              <button
                onClick={handleArrowClick}
                className="ml-1 p-1 hover:bg-glass-light rounded transition-colors duration-200"
                title="Kategorileri göster/gizle"
              >
                <motion.svg
                  className="w-4 h-4 text-primary-700 hover:text-scientific-blue-600 transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  animate={{ rotate: isMegaMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>
            </motion.div>

            {/* Other Navigation Items */}
            {navigationItems.slice(1).map((item, index) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              >
                <Link
                  to={item.href}
                  className="relative text-primary-700 hover:text-scientific-blue-600 font-medium transition-colors duration-300 group"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  {t(`nav.${item.key}`)}
                  {/* Hover underline effect */}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-scientific-blue-500 to-scientific-green-500 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Global Search Bar - Mobile */}
          <div className="lg:hidden w-full" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowSearchDropdown(true)
                    }
                  }}
                  placeholder="Ürün, marka, CAS ara..."
                  className="w-full px-10 py-2.5 text-sm bg-white/80 backdrop-blur-sm border-2 border-white/30 rounded-xl focus:outline-none focus:border-scientific-blue-400 focus:bg-white/90 transition-all duration-300 placeholder-primary-400"
                />
                
                {/* Search Icon */}
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>

                {/* Loading Spinner */}
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="animate-spin h-4 w-4 text-scientific-blue-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>

              {/* Mobile Search Results Dropdown */}
              <AnimatePresence>
                {showSearchDropdown && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl border border-white/30 py-2 z-50 max-h-60 overflow-y-auto"
                  >
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                      Sonuçlar
                    </div>
                    
                    {searchResults.slice(0, 3).map((product, index) => (
                      <motion.button
                        key={product.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleProductClick(product.id)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="text-lg">🧪</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate text-sm">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {[
                                product.brand && product.brand.trim(),
                                product.cas && product.cas.trim(),
                                product.productCode && `Kod: ${product.productCode}`
                              ].filter(Boolean).join(' • ') || 'Kimyasal Ürün'}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                    
                    <motion.button
                      onClick={handleSearchSubmit}
                      className="w-full mt-1 px-3 py-2 text-white bg-scientific-blue-500 hover:bg-scientific-blue-600 transition-colors duration-200 text-sm font-semibold"
                    >
                      Tüm sonuçları gör
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Auth Button, Language Selector & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            
            {/* Auth Section */}
            {!loading && (
              <>
                {user ? (
                  /* User Dropdown */
                  <div className="relative hidden md:block">
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-glass-light backdrop-blur-sm border border-glass-medium hover:bg-glass-medium transition-all duration-300"
                    >
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt="Profile"
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-scientific-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                      <span className="text-sm font-medium text-primary-700 max-w-24 truncate">
                        {user.displayName || user.email?.split('@')[0]}
                      </span>
                      <motion.svg
                        animate={{ rotate: isUserDropdownOpen ? 180 : 0 }}
                        className="w-4 h-4 text-primary-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </motion.button>

                    {/* User Dropdown Menu */}
                    <AnimatePresence>
                      {isUserDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute top-full right-0 mt-2 w-48 bg-glass-medium backdrop-blur-lg border border-glass-light rounded-xl shadow-xl py-2 z-10"
                        >
                          <div className="px-4 py-2 border-b border-glass-light">
                            <p className="text-sm font-medium text-primary-700 truncate">{user.displayName}</p>
                            <p className="text-xs text-primary-500 truncate">{user.email}</p>
                          </div>
                          
                          {user.email === 'admin@kimyalab.com' && (
                            <Link
                              to="/admin"
                              onClick={() => setIsUserDropdownOpen(false)}
                              className="w-full text-left px-4 py-2 flex items-center space-x-3 text-primary-700 hover:text-scientific-blue-600 transition-colors duration-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>Admin Paneli</span>
                            </Link>
                          )}
                          
                          <motion.button
                            whileHover={{ x: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                            onClick={handleSignOut}
                            className="w-full text-left px-4 py-2 flex items-center space-x-3 text-primary-700 hover:text-red-600 transition-colors duration-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>{t('auth.logout')}</span>
                          </motion.button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  /* Login Button */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="hidden md:block"
                  >
                    <Link
                      to="/auth"
                      className="btn-primary text-sm py-2 px-4"
                    >
                      {t('nav.login')}
                    </Link>
                  </motion.div>
                )}
              </>
            )}
            
            {/* Language Dropdown */}
            <div className="relative">
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-glass-light backdrop-blur-sm border border-glass-medium hover:bg-glass-medium transition-all duration-300"
              >
                <span className="text-lg">{getLanguageFlag(i18n.language)}</span>
                <span className="hidden sm:inline text-sm font-medium text-primary-700">
                  {getCurrentLanguageDisplay()}
                </span>
                <motion.svg
                  animate={{ rotate: isLanguageDropdownOpen ? 180 : 0 }}
                  className="w-4 h-4 text-primary-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </motion.button>

              {/* Language Dropdown Menu */}
              <AnimatePresence>
                {isLanguageDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-40 bg-glass-medium backdrop-blur-lg border border-glass-light rounded-xl shadow-xl py-2 z-10"
                  >
                    {Object.entries(availableLanguages).map(([code, name]) => (
                      <motion.button
                        key={code}
                        whileHover={{ x: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        onClick={() => handleLanguageChange(code)}
                        className={`w-full text-left px-4 py-2 flex items-center space-x-3 transition-colors duration-200 ${
                          i18n.language === code 
                            ? 'text-scientific-blue-600 bg-glass-light' 
                            : 'text-primary-700 hover:text-scientific-blue-600'
                        }`}
                      >
                        <span className="text-lg">{getLanguageFlag(code)}</span>
                        <span className="font-medium">{name}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-glass-light backdrop-blur-sm border border-glass-medium hover:bg-glass-medium transition-all duration-300"
            >
              <motion.div
                animate={{ rotate: isMobileMenuOpen ? 45 : 0 }}
                className="w-6 h-6 relative"
              >
                <motion.span
                  animate={{
                    rotate: isMobileMenuOpen ? 45 : 0,
                    y: isMobileMenuOpen ? 8 : 0,
                  }}
                  className="absolute top-1 left-0 w-6 h-0.5 bg-primary-700 block transform transition-all duration-300"
                />
                <motion.span
                  animate={{ opacity: isMobileMenuOpen ? 0 : 1 }}
                  className="absolute top-3 left-0 w-6 h-0.5 bg-primary-700 block transition-all duration-300"
                />
                <motion.span
                  animate={{
                    rotate: isMobileMenuOpen ? -45 : 0,
                    y: isMobileMenuOpen ? -8 : 0,
                  }}
                  className="absolute top-5 left-0 w-6 h-0.5 bg-primary-700 block transform transition-all duration-300"
                />
              </motion.div>
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden border-t border-glass-medium mt-4 pt-4 pb-6"
            >
              <div className="flex flex-col space-y-4">
                {/* Home Link */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0 }}
                >
                  <Link
                    to="/"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="text-primary-700 hover:text-scientific-blue-600 font-medium py-2 px-4 rounded-lg hover:bg-glass-light transition-all duration-300 block"
                  >
                    {t('nav.home')}
                  </Link>
                </motion.div>

                {/* Mobile Products Menu */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <div className="space-y-2">
                    {/* Main Products Link for Mobile */}
                    <Link
                      to="/urunler"
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="text-primary-700 hover:text-scientific-blue-600 font-medium py-2 px-4 rounded-lg hover:bg-glass-light transition-all duration-300 block"
                    >
                      {t('nav.products')}
                    </Link>
                    
                    {/* Dropdown Toggle for Mobile */}
                    <button
                      onClick={handleMegaMenuToggle}
                      className="text-primary-600 hover:text-scientific-blue-600 font-medium py-2 px-4 rounded-lg hover:bg-glass-light transition-all duration-300 block w-full text-left flex items-center justify-between text-sm"
                    >
                      <span>Kategoriler</span>
                      <motion.svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        animate={{ rotate: isMegaMenuOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </button>
                  </div>
                </motion.div>

                {/* Other Navigation Items */}
                {navigationItems.slice(1).map((item, index) => (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
                  >
                    <Link
                      to={item.href}
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="text-primary-700 hover:text-scientific-blue-600 font-medium py-2 px-4 rounded-lg hover:bg-glass-light transition-all duration-300 block"
                    >
                      {t(`nav.${item.key}`)}
                    </Link>
                  </motion.div>
                ))}

                
                {/* Mobile Auth Section */}
                <div className="border-t border-glass-medium pt-4 mt-4">
                  {user ? (
                    <div className="space-y-2">
                      <div className="px-4 py-2">
                        <p className="text-primary-700 font-medium text-sm">{user.displayName}</p>
                        <p className="text-primary-500 text-xs">{user.email}</p>
                      </div>
                      
                      {user.email === 'admin@kimyalab.com' && (
                        <Link
                          to="/admin"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="w-full text-left px-4 py-2 text-scientific-blue-600 hover:bg-glass-light transition-all duration-300 block flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Admin Paneli</span>
                        </Link>
                      )}
                      
                      <motion.button
                        whileHover={{ x: 4, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-glass-light transition-all duration-300 block"
                      >
                        Çıkış Yap
                      </motion.button>
                    </div>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-center btn-primary text-sm py-2 px-4 mx-4"
                    >
                      Giriş Yap
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click outside to close dropdowns */}
      {(isLanguageDropdownOpen || isMobileMenuOpen || isUserDropdownOpen || isMegaMenuOpen || showSearchDropdown) && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => {
            setIsLanguageDropdownOpen(false)
            setIsMobileMenuOpen(false)
            setIsUserDropdownOpen(false)
            setIsMegaMenuOpen(false)
            setShowSearchDropdown(false)
          }}
        />
      )}

      {/* Mega Menu */}
      <MegaMenu
        isOpen={isMegaMenuOpen}
        onClose={handleMegaMenuClose}
        isMobile={isMobile}
      />
    </motion.nav>
  )
}

export default Navbar