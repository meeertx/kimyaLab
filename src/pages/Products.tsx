import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Category, Product } from '../types'
import ProductImage from '../components/ProductImage/ProductImage'

// Services
import { ProductService, CategoryService } from '../services/productService'

// Hooks
import { useSEO } from '../hooks/useSEO'

// Components
import Molecules3D from '../components/Molecules3D/Molecules3D'

const Products: React.FC = () => {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  
  // Safer scroll hook with conditional rendering
  const [isScrollReady, setIsScrollReady] = useState(false)
  
  useEffect(() => {
    // Ensure ref is ready before using scroll hook
    const timer = setTimeout(() => setIsScrollReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
    layoutEffect: false
  })

  // Parallax effects - only apply when ready
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3])

  // SEO
  useSEO({
    title: 'Ürünler - Kimya Laboratuvarı Ürün Kataloğu',
    description: 'Kimyalab ürün kataloğu. Kimyasallar, yaşam bilimleri ürünleri, hammaddeler ve analiz ürünleri. Laboratuvarınız için ihtiyacınız olan tüm ürünler.',
    keywords: ['kimyasal ürünler', 'laboratuvar', 'kimya', 'analiz', 'yaşam bilimleri', 'hammaddeler', 'kimyevi maddeler'],
    type: 'website'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [selectedSearchType, setSelectedSearchType] = useState<'all' | 'name' | 'code' | 'cas' | 'brand'>('all')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Floating animation variants for molecules
  const moleculeFloatingVariants = {
    animate: {
      y: [0, -30, 0],
      x: [0, 10, -10, 0],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  // Load search history from localStorage and handle URL search params
  const location = useLocation()
  
  useEffect(() => {
    const savedHistory = localStorage.getItem('kimyalab-search-history')
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory))
    }
    
    // Handle search parameter from URL (coming from homepage)
    const urlParams = new URLSearchParams(location.search)
    const searchParam = urlParams.get('search')
    
    if (searchParam) {
      setSearchTerm(searchParam)
      saveSearchToHistory(searchParam)
      // Focus the search input after a short delay
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [location])

  // Load categories from PostgreSQL Backend
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true)
        setError(null)
        const categoriesData = await CategoryService.getCategories()
        setCategories(categoriesData)
      } catch (err) {
        console.error('Error loading categories:', err)
        setError('Kategoriler yüklenirken bir hata oluştu.')
        // Fallback to empty array
        setCategories([])
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [])

  // Flexible search with PostgreSQL Backend
  const performFlexibleSearch = async (query: string, type: string = 'all'): Promise<Product[]> => {
    try {
      const results = await ProductService.searchProducts(query)
      
      // Apply type-specific filtering for more accurate results
      if (type !== 'all' && results.length > 0) {
        return results.filter((product: Product) => {
          switch (type) {
            case 'name':
              return product.name.toLowerCase().includes(query.toLowerCase()) ||
                     product.nameEn?.toLowerCase().includes(query.toLowerCase())
            case 'code':
              return product.productCode?.toLowerCase().includes(query.toLowerCase()) ||
                     product.searchableFields?.serialNumber?.toLowerCase().includes(query.toLowerCase()) ||
                     product.searchableFields?.modelNumber?.toLowerCase().includes(query.toLowerCase())
            case 'cas':
              return product.cas?.toLowerCase().includes(query.toLowerCase())
            case 'brand':
              return product.brand?.toLowerCase().includes(query.toLowerCase())
            default:
              return true
          }
        })
      }
      
      return results
    } catch (error) {
      console.error('Search error:', error)
      return []
    }
  }

  // Generate search suggestions from search results
  const generateSearchSuggestions = (products: Product[], query: string, maxSuggestions: number = 4): string[] => {
    const suggestions = new Set<string>()
    
    products.forEach(product => {
      // Add product name if it contains the query
      if (product.name.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(product.name)
      }
      // Add brand
      if (product.brand?.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(product.brand)
      }
      // Add product code
      if (product.productCode?.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(product.productCode)
      }
      // Add CAS number
      if (product.cas?.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(product.cas)
      }
    })

    return Array.from(suggestions).slice(0, maxSuggestions)
  }

  // Real-time search with PostgreSQL Backend
  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      setIsSearching(true)
      const timeoutId = setTimeout(async () => {
        try {
          const results = await performFlexibleSearch(searchTerm, selectedSearchType)
          setSearchResults(results.slice(0, 6)) // Show top 6 results
          
          if (searchTerm.length >= 2) {
            const suggestions = generateSearchSuggestions(results, searchTerm, 4)
            setSearchSuggestions(suggestions)
            setShowSuggestions(suggestions.length > 0 || results.length > 0)
          }
        } catch (error) {
          console.error('Search error:', error)
          setSearchResults([])
          setSearchSuggestions([])
        } finally {
          setIsSearching(false)
        }
      }, 400) // Debounced search for performance

      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
      setSearchSuggestions([])
      setShowSuggestions(searchHistory.length > 0)
      setIsSearching(false)
    }
  }, [searchTerm, selectedSearchType])

  // Save search to history
  const saveSearchToHistory = (query: string) => {
    if (query.trim() && !searchHistory.includes(query.trim())) {
      const newHistory = [query.trim(), ...searchHistory.slice(0, 9)] // Keep last 10 searches
      setSearchHistory(newHistory)
      localStorage.setItem('kimyalab-search-history', JSON.stringify(newHistory))
    }
  }

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      saveSearchToHistory(searchTerm.trim())
      navigate(`/arama?q=${encodeURIComponent(searchTerm.trim())}`)
      setShowSuggestions(false)
    }
  }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion)
    setShowSuggestions(false)
    saveSearchToHistory(suggestion)
    navigate(`/arama?q=${encodeURIComponent(suggestion)}`)
  }

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([])
    localStorage.removeItem('kimyalab-search-history')
  }

  // Quick search shortcuts
  const quickSearches = [
    { label: 'pH Buffers', query: 'pH buffer', icon: '⚗️' },
    { label: 'HPLC Solvents', query: 'HPLC', icon: '🧪' },
    { label: 'Cell Culture', query: 'cell culture', icon: '🦠' },
    { label: 'Antibodies', query: 'antibody', icon: '🔬' }
  ]

  // Search type options
  const searchTypes = [
    { value: 'all', label: 'Tümü', icon: '🔍' },
    { value: 'name', label: 'Ürün Adı', icon: '📝' },
    { value: 'code', label: 'Ürün Kodu', icon: '#️⃣' },
    { value: 'cas', label: 'CAS No', icon: '🧬' },
    { value: 'brand', label: 'Marka', icon: '🏷️' }
  ]

  // Handle product click from dropdown
  const handleProductClick = (productId: string) => {
    navigate(`/urun/${productId}`)
    setShowSuggestions(false)
    setSearchTerm('')
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative min-h-screen pt-24 pb-12 overflow-hidden"
    >
      
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-scientific-blue-50 to-scientific-green-50" />
      
      {/* 3D Molecules Background - Conditionally rendered for performance */}
      {isScrollReady && (
        <motion.div
          style={{ y, opacity }}
          className="absolute inset-0 opacity-30"
        >
          <Molecules3D height="200vh" />
        </motion.div>
      )}
      
      {/* Additional floating CSS molecules for layered effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Small CSS molecules for extra particles */}
        <motion.div
          variants={moleculeFloatingVariants}
          animate="animate"
          className="absolute top-20 right-10 w-16 h-16 opacity-10"
        >
          <div className="relative">
            <div className="w-3 h-3 bg-accent-gold-400 rounded-full absolute top-0 left-0 animate-pulse" />
            <div className="w-2 h-2 bg-scientific-blue-400 rounded-full absolute top-4 left-3 animate-pulse animation-delay-200" />
            <div className="absolute top-1 left-1 w-3 h-0.5 bg-gradient-to-r from-accent-gold-400 to-scientific-blue-400 rotate-45 opacity-60" />
          </div>
        </motion.div>

        <motion.div
          variants={moleculeFloatingVariants}
          animate="animate"
          className="absolute bottom-32 left-20 w-12 h-12 opacity-15"
          style={{ animationDelay: '3s' }}
        >
          <div className="relative">
            <div className="w-2 h-2 bg-blue-400 rounded-full absolute top-0 left-0 animate-pulse" />
            <div className="w-3 h-3 bg-green-400 rounded-full absolute top-2 left-2 animate-pulse animation-delay-400" />
            <div className="absolute top-1 left-1 w-2 h-0.5 bg-gradient-to-r from-blue-400 to-green-400 -rotate-30 opacity-60" />
          </div>
        </motion.div>

        <motion.div
          variants={moleculeFloatingVariants}
          animate="animate"
          className="absolute top-40 left-1/3 w-14 h-14 opacity-12"
          style={{ animationDelay: '5s' }}
        >
          <div className="relative">
            <div className="w-2 h-2 bg-purple-400 rounded-full absolute top-0 left-1 animate-pulse" />
            <div className="w-3 h-3 bg-pink-400 rounded-full absolute top-3 left-3 animate-pulse animation-delay-300" />
            <div className="w-2 h-2 bg-orange-400 rounded-full absolute top-1 left-4 animate-pulse animation-delay-600" />
            <div className="absolute top-1 left-2 w-2 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rotate-60 opacity-60" />
            <div className="absolute top-2 left-3 w-1 h-0.5 bg-gradient-to-r from-pink-400 to-orange-400 -rotate-45 opacity-60" />
          </div>
        </motion.div>
      </div>
      
      <div className="container-responsive relative z-10">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-gradient text-4xl lg:text-6xl font-bold mb-6">
            {t('products.title')}
          </h1>
          <p className="text-xl text-primary-600 max-w-3xl mx-auto mb-8">
            {t('products.subtitle')}
          </p>
          <p className="text-lg text-primary-500 max-w-4xl mx-auto leading-relaxed">
            {t('products.description')}
          </p>
        </motion.div>

        {/* Enhanced Flexible Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto mb-16"
        >
          {/* Quick Search Shortcuts */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {quickSearches.map((shortcut, index) => (
              <motion.button
                key={shortcut.query}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  setSearchTerm(shortcut.query)
                  saveSearchToHistory(shortcut.query)
                  navigate(`/arama?q=${encodeURIComponent(shortcut.query)}`)
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-scientific-blue-50 to-accent-gold-50 text-scientific-blue-700 rounded-full text-sm font-medium hover:from-scientific-blue-100 hover:to-accent-gold-100 transition-all duration-200 border border-scientific-blue-200"
              >
                <span>{shortcut.icon}</span>
                <span>{shortcut.label}</span>
              </motion.button>
            ))}
          </div>

          <div className="relative" ref={searchContainerRef}>
            {/* Search Type Selector */}
            <div className="flex items-center mb-4 bg-white/80 backdrop-blur-md rounded-xl p-2 border border-white/30">
              <span className="text-sm font-medium text-primary-600 mr-3 px-2">Arama Türü:</span>
              <div className="flex flex-wrap gap-2">
                {searchTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedSearchType(type.value as any)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedSearchType === type.value
                        ? 'bg-gradient-to-r from-scientific-blue-500 to-accent-gold-500 text-white shadow-md'
                        : 'bg-white/60 text-primary-600 hover:bg-white/80'
                    }`}
                  >
                    <span className="text-xs">{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="ml-auto px-3 py-1.5 text-scientific-blue-600 hover:text-scientific-blue-700 font-medium text-sm flex items-center space-x-1"
              >
                <span>Gelişmiş</span>
                <motion.svg
                  animate={{ rotate: showAdvancedFilters ? 180 : 0 }}
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
              </button>
            </div>

            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowSuggestions(searchSuggestions.length > 0 || searchResults.length > 0 || searchHistory.length > 0)}
                  placeholder={
                    selectedSearchType === 'all' ? "Ör: 'Polysorbate 80', 'CAS: 9005-65-6', 'KL-2024' veya 'Sigma'" :
                    selectedSearchType === 'name' ? "Ürün adını girin (ör: Polysorbate 80)" :
                    selectedSearchType === 'code' ? "Ürün kodunu girin (ör: KL-2024-001)" :
                    selectedSearchType === 'cas' ? "CAS numarasını girin (ör: 9005-65-6)" :
                    "Marka adını girin (ör: Sigma)"
                  }
                  className="w-full px-6 py-4 pl-14 pr-32 rounded-2xl bg-white/90 backdrop-blur-md border-2 border-white/30 focus:outline-none focus:border-scientific-blue-400 focus:ring-2 focus:ring-scientific-blue-400/20 transition-all duration-300 text-lg shadow-lg"
                  autoComplete="off"
                />
                
                {/* Advanced Search Indicator */}
                {selectedSearchType !== 'all' && (
                  <div className="absolute right-20 top-1/2 transform -translate-y-1/2">
                    <div className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-scientific-blue-100 to-accent-gold-100 rounded-lg text-xs font-medium text-scientific-blue-700">
                      <span>{searchTypes.find(t => t.value === selectedSearchType)?.icon}</span>
                      <span>{searchTypes.find(t => t.value === selectedSearchType)?.label}</span>
                    </div>
                  </div>
                )}
              </div>
            </form>
            
            {/* Search Icon */}
            <svg
              className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            {/* Loading Spinner */}
            {isSearching && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <svg className="animate-spin h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}

            {/* Enhanced Search Dropdown */}
            <AnimatePresence>
              {showSuggestions && (searchSuggestions.length > 0 || searchResults.length > 0 || searchHistory.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-white/30 z-50 max-h-[32rem] overflow-y-auto"
                >
                  {/* Search History */}
                  {searchTerm.length === 0 && searchHistory.length > 0 && (
                    <div className="p-2 border-b border-gray-100">
                      <div className="flex items-center justify-between px-3 py-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          Son Aramalar
                        </div>
                        <button
                          onClick={clearSearchHistory}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Temizle
                        </button>
                      </div>
                      {searchHistory.slice(0, 5).map((query, index) => (
                        <motion.button
                          key={`${query}-${index}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => handleSuggestionClick(query)}
                          className="w-full text-left px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-150 flex items-center space-x-3"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="flex-1">{query}</span>
                          <span className="text-xs text-gray-400">Geçmiş</span>
                        </motion.button>
                      ))}
                    </div>
                  )}
                  {/* Search Suggestions */}
                  {searchSuggestions.length > 0 && (
                    <div className="p-2">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Öneriler
                      </div>
                      {searchSuggestions.map((suggestion, index) => (
                        <motion.button
                          key={suggestion}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-150 flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <span>{suggestion}</span>
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* Search Results Preview */}
                  {searchResults.length > 0 && (
                    <div className="border-t border-gray-200 p-2">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Ürünler
                      </div>
                      {searchResults.map((product, index) => (
                        <motion.button
                          key={product.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleProductClick(product.id)}
                          className="w-full text-left px-3 py-3 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">
                              {product.images && product.images[0] ? (
                                <ProductImage
                                  src={product.images[0].url}
                                  alt={product.images[0].alt || product.name}
                                  className="w-8 h-8"
                                />
                              ) : (
                                '🧪'
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{product.name}</div>
                              <div className="text-sm text-gray-500 truncate">
                                {product.brand} • {product.cas}
                              </div>
                              <div className="text-sm font-semibold text-blue-600">
                                {product.currency}{product.price}
                              </div>
                            </div>
                            <div className={`px-2 py-1 text-xs rounded-full ${
                              product.stock
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.stock ? 'Stokta' : 'Stok Yok'}
                            </div>
                          </div>
                        </motion.button>
                      ))}
                      
                      {searchResults.length >= 6 && (
                        <motion.button
                          onClick={handleSearchSubmit}
                          className="w-full mt-2 px-3 py-2 text-white bg-gradient-to-r from-scientific-blue-500 to-accent-gold-500 hover:from-scientific-blue-600 hover:to-accent-gold-600 rounded-lg transition-all duration-200 text-sm font-semibold shadow-lg"
                        >
                          Tüm sonuçları gör →
                        </motion.button>
                      )}
                    </div>
                  )}

                  {/* No Results */}
                  {searchTerm.length > 0 && !isSearching && searchResults.length === 0 && searchSuggestions.length === 0 && (
                    <div className="p-4 text-center text-gray-500">
                      <div className="text-4xl mb-2">🔍</div>
                      <div className="font-medium">Sonuç bulunamadı</div>
                      <div className="text-sm">"{searchTerm}" için eşleşen ürün yok</div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Advanced Filters Panel */}
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 p-6 bg-white/80 backdrop-blur-md rounded-xl border border-white/30 shadow-lg overflow-hidden"
              >
                <h3 className="text-lg font-semibold text-primary-700 mb-4">Gelişmiş Arama Filtreleri</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-primary-600 mb-2">Kategori</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-scientific-blue-400">
                      <option value="">Tüm Kategoriler</option>
                      <option value="chemicals">Kimyasallar</option>
                      <option value="life_sciences">Yaşam Bilimleri</option>
                      <option value="raw_materials">Ham Maddeler</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-600 mb-2">Fiyat Aralığı</label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Min"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-scientific-blue-400"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-scientific-blue-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary-600 mb-2">Stok Durumu</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-scientific-blue-400">
                      <option value="">Tümü</option>
                      <option value="in_stock">Stokta Var</option>
                      <option value="out_of_stock">Stokta Yok</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  <button className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors">
                    Filtreleri Temizle
                  </button>
                  <button className="px-6 py-2 bg-gradient-to-r from-scientific-blue-500 to-accent-gold-500 text-white rounded-lg hover:from-scientific-blue-600 hover:to-accent-gold-600 transition-all duration-200 font-medium">
                    Filtreleri Uygula
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Tips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-6 text-center text-sm text-primary-500"
          >
            <p className="mb-2">💡 <strong>Arama İpuçları:</strong></p>
            <div className="flex flex-wrap justify-center gap-4">
              <span>• "Polysorbate" - Ürün adı ile</span>
              <span>• "9005-65-6" - CAS numarası ile</span>
              <span>• "KL-2024" - Ürün kodu ile</span>
              <span>• "Sigma" - Marka ile</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Categories Grid */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-primary-800 mb-8 text-center">
            {t('nav.categories')}
          </h2>
          
          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-scientific-blue-500"></div>
              <span className="ml-3 text-primary-600">Kategoriler yükleniyor...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <div className="text-red-500 text-4xl mb-2">⚠️</div>
              <p className="text-red-700 font-medium">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Yeniden Dene
              </button>
            </div>
          )}
          
          {/* Categories Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {categories.map((category: Category, index: number) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="card-3d p-8 group cursor-pointer"
                >
                  <Link to={`/kategori/${category.slug}`} className="block">
                    <div className="text-center">
                      <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
                        {category.icon}
                      </div>
                      
                      <h3 className="text-gradient text-2xl font-bold mb-4">
                        {category.name}
                      </h3>
                      
                      <p className="text-primary-600 leading-relaxed mb-6">
                        {category.description}
                      </p>
                      
                      <div className="flex items-center justify-center space-x-2 text-scientific-blue-500">
                        <span className="font-semibold">{category.productCount || 0}</span>
                        <span>{t('products.results_found')}</span>
                        <motion.svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          whileHover={{ x: 5 }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </motion.svg>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
              
              {/* Empty state */}
              {categories.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="text-xl font-semibold text-primary-700 mb-2">
                    Henüz kategori bulunmuyor
                  </h3>
                  <p className="text-primary-500">
                    Kategoriler eklendiğinde burada görünecek.
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-20 bg-gradient-to-r from-scientific-blue-50 to-scientific-green-50 rounded-3xl p-12"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gradient mb-4">
              Ürün İstatistikleri
            </h2>
            <p className="text-primary-600 text-lg">
              Geniş ürün yelpazemizle bilimsel araştırmalarınızı destekliyoruz
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                number: !loading && categories.length > 0
                  ? (categories.reduce((total: number, cat: Category) => total + (cat.productCount || 0), 0).toString() + "+")
                  : "...",
                label: "Toplam Ürün"
              },
              {
                number: !loading && categories.length > 0
                  ? (categories.reduce((total: number, cat: Category) => total + (cat.subcategories?.length || 0), 0).toString() + "+")
                  : "...",
                label: "Alt Kategori"
              },
              {
                number: "10+",
                label: "Güvenilir Marka"
              },
              {
                number: "99.9%",
                label: "Kalite Garantisi"
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-neon-gradient text-4xl font-bold mb-2">
                  {stat.number}
                </div>
                <div className="text-primary-600 font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Products

// Status indicator
console.log('🚀 Products: Using PostgreSQL Backend (Firebase removed)')