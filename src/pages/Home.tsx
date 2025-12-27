import React, { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
// Firebase removed - using PostgreSQL Backend

// Types
import { Product } from '../types'

// Services
import { ProductService } from '../services/productService'

// Components
import Molecules3D from '../components/Molecules3D/Molecules3D'
import ProductImage from '../components/ProductImage/ProductImage'

// Hooks
import { useSEO, generateOrganizationStructuredData, injectStructuredData } from '../hooks/useSEO'

const Home: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  })

  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)

  // Parallax effects
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3])
  
  // SEO
  useSEO({
    title: t('nav.home'),
    description: 'Kimya ve yaşam bilimleri alanında yüksek kaliteli ürünler ve çözümler. Modern teknolojiler ve uzman kadromuzla bilimsel projelerinizi destekliyoruz.',
    keywords: ['kimya', 'laboratuvar', 'kimyasal ürünler', 'bilimsel çözümler', 'araştırma', 'analiz', 'reagent'],
    type: 'website'
  })

  // Inject organization structured data
  useEffect(() => {
    injectStructuredData(generateOrganizationStructuredData(), 'organization-data')
  }, [])

  // PostgreSQL Backend featured products subscription (polling-based)
  useEffect(() => {
    setLoadingProducts(true)
    setProductsError(null)

    const unsubscribe = ProductService.subscribeToFeaturedProducts(
      (products: Product[]) => {
        setFeaturedProducts(products.slice(0, 6))
        setLoadingProducts(false)
        setProductsError(null)
      },
      6
    )

    // Handle subscription error
    if (!unsubscribe) {
      setProductsError('Polling bağlantı kurulamadı. Fallback veriler kullanılıyor.')
      setLoadingProducts(false)
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [])

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

  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/arama?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const searchSuggestions = [
    'Polysorbate 80',
    'Lecithin',
    'Histidin',
    'Casein Peptone',
    'SDS Buffer',
    'COA-12345'
  ]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative min-h-screen overflow-hidden"
    >
      
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-scientific-blue-50 to-scientific-green-50" />
      
      {/* 3D Molecules Background */}
      <motion.div
        style={{ y, opacity }}
        className="absolute inset-0 opacity-30"
      >
        <Molecules3D height="200vh" />
      </motion.div>
      
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

      <div className="relative z-10">
        
        {/* Hero Section - İçerik direkt burada */}
        <section className="relative min-h-screen flex items-center justify-center pt-24 lg:pt-32">
          {/* Main Content */}
          <motion.div
            style={{ y, opacity: useTransform(scrollYProgress, [0, 1], [1, 0]) }}
            className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"
          >
            
            {/* Main Title */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="mb-8"
            >
              <motion.h1
                variants={floatingVariants}
                animate="animate"
                className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6"
              >
                <span className="text-gradient">
                  {t('hero.title')}
                </span>
              </motion.h1>
              
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.4 }}
                className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary-700 mb-8"
              >
                {t('hero.subtitle')}
              </motion.h2>
            </motion.div>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="text-lg sm:text-xl text-primary-600 max-w-3xl mx-auto mb-12 leading-relaxed"
            >
              {t('hero.description')}
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <span>{t('hero.cta_primary')}</span>
                  <motion.svg
                    whileHover={{ x: 5 }}
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                  </motion.svg>
                </span>
                {/* Button glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent-gold-400 via-accent-pink-300 to-accent-lavender-300 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-full" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary group"
              >
                <span className="flex items-center space-x-2">
                  <motion.svg
                    whileHover={{ scale: 1.1 }}
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </motion.svg>
                  <span>{t('hero.cta_secondary')}</span>
                </span>
              </motion.button>
            </motion.div>

            {/* Prominent Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.0 }}
              className="mt-16 max-w-4xl mx-auto"
            >
              <div className="relative">
                {/* Search Title */}
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="text-center text-xl font-semibold text-primary-700 mb-6"
                >
                  Kimyasal, Ürün Kodu, CAS Numarası veya Model ile Arayın
                </motion.h3>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="relative">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileFocus={{ scale: 1.02 }}
                    className={`
                      relative bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border-2 transition-all duration-300
                      ${searchFocused
                        ? 'border-gradient-to-r from-scientific-blue-400 to-accent-gold-400 shadow-glow'
                        : 'border-white/30 hover:border-scientific-blue-300'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      {/* Search Icon */}
                      <div className="flex-shrink-0 pl-6">
                        <motion.svg
                          animate={{
                            scale: searchFocused ? 1.1 : 1,
                            rotate: searchFocused ? [0, 5, -5, 0] : 0
                          }}
                          transition={{ duration: 0.3 }}
                          className="w-6 h-6 text-scientific-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </motion.svg>
                      </div>

                      {/* Search Input */}
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        placeholder="Ör: 'Polysorbate 80', 'CAS: 9005-65-6', 'KL-2024-001' veya 'Model ABC-123'"
                        className="flex-1 px-6 py-6 text-lg bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-primary-800 placeholder-primary-400"
                        style={{ outline: 'none', boxShadow: 'none' }}
                      />

                      {/* Search Button */}
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-shrink-0 mr-3 px-8 py-4 bg-gradient-to-r from-scientific-blue-500 to-scientific-blue-600 hover:from-scientific-blue-600 hover:to-scientific-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <span className="flex items-center space-x-2">
                          <span>Ara</span>
                          <motion.svg
                            whileHover={{ x: 3 }}
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                          </motion.svg>
                        </span>
                      </motion.button>
                    </div>

                    {/* Floating Search Suggestions */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity: searchFocused && searchQuery.length === 0 ? 1 : 0,
                        y: searchFocused && searchQuery.length === 0 ? 0 : 10
                      }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-white/30 p-4 z-50"
                    >
                      <p className="text-sm text-primary-600 mb-3 font-medium">Popüler Aramalar:</p>
                      <div className="flex flex-wrap gap-2">
                        {searchSuggestions.map((suggestion, index) => (
                          <motion.button
                            key={index}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            onClick={() => setSearchQuery(suggestion)}
                            className="px-3 py-2 bg-gradient-to-r from-scientific-blue-50 to-accent-gold-50 text-scientific-blue-700 rounded-lg text-sm hover:from-scientific-blue-100 hover:to-accent-gold-100 transition-all duration-200"
                          >
                            {suggestion}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                </form>

                {/* Search Features */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                  className="mt-6 text-center"
                >
                  <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-primary-600">
                    <span className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></span>
                      <span>Flexible Arama</span>
                    </span>
                    <span className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"></span>
                      <span>Hızlı Sonuçlar</span>
                    </span>
                    <span className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"></span>
                      <span>Akıllı Filtreler</span>
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>

          </motion.div>
        </section>
      
        {/* Features Section */}
        <section className="section-padding">
          <div className="container-responsive">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-gradient text-4xl font-bold mb-4">
              {t('sections.research.title')}
            </h2>
            <p className="text-primary-600 text-lg max-w-3xl mx-auto">
              {t('hero.description')}
            </p>
          </motion.div>

          <div className="grid-features">
            {[
              {
                title: t('sections.research.title'),
                description: t('sections.research.description'),
                icon: "🔬",
                delay: 0.1
              },
              {
                title: t('sections.laboratory.title'),
                description: t('sections.laboratory.description'),
                icon: "🧪",
                delay: 0.2
              },
              {
                title: t('sections.innovation.title'),
                description: t('sections.innovation.description'),
                icon: "💡",
                delay: 0.3
              },
              {
                title: t('sections.sustainability.title'),
                description: t('sections.sustainability.description'),
                icon: "🌱",
                delay: 0.4
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: feature.delay }}
                viewport={{ once: true }}
                className="card-3d p-8 text-center group"
              >
                <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-gradient text-xl font-bold mb-4">
                  {feature.title}
                </h3>
                <p className="text-primary-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="section-padding bg-gradient-to-br from-scientific-blue-50 to-accent-gold-50">
          <div className="container-responsive">
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-gradient text-4xl font-bold mb-4">
                Öne Çıkan Ürünler
              </h2>
              <p className="text-primary-600 text-lg max-w-3xl mx-auto">
                En popüler ve kaliteli kimyasal ürünlerimizi keşfedin
              </p>
            </motion.div>

            {/* Loading State */}
            {loadingProducts && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-scientific-blue-500"></div>
                <span className="ml-3 text-primary-600">Ürünler yükleniyor...</span>
              </div>
            )}

            {/* Error State */}
            {productsError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center max-w-md mx-auto">
                <div className="text-red-500 text-4xl mb-2">⚠️</div>
                <p className="text-red-700 font-medium">{productsError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Yeniden Dene
                </button>
              </div>
            )}

            {/* Featured Products Grid */}
            {!loadingProducts && !productsError && featuredProducts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="card-3d group cursor-pointer"
                    whileHover={{ y: -5 }}
                  >
                    <Link to={`/urun/${product.id}`} className="block">
                      <div className="p-6">
                        {/* Product Image */}
                        <div className="aspect-square mb-4 group-hover:scale-105 transition-transform duration-300 overflow-hidden rounded-xl">
                          <ProductImage
                            src={product.images?.[0]?.url}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-xl"
                            placeholderClassName="w-full h-full rounded-xl"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-primary-800 group-hover:text-scientific-blue-600 transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                          
                          <div className="flex items-center justify-between text-sm text-primary-500">
                            <span>{product.brand}</span>
                            <span>CAS: {product.cas}</span>
                          </div>

                          <p className="text-primary-600 text-sm line-clamp-2">
                            {product.description}
                          </p>

                          <div className="flex items-center justify-between pt-2">
                            <div className="text-lg font-bold text-scientific-blue-600">
                              {product.currency}{product.price}
                            </div>
                            <div className={`px-2 py-1 text-xs rounded-full ${
                              product.stock
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.stock ? 'Stokta' : 'Stok Yok'}
                            </div>
                          </div>

                          {/* View Details Button */}
                          <div className="pt-3">
                            <div className="w-full bg-gradient-to-r from-scientific-blue-500 to-accent-gold-500 text-white text-center py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">
                              Detayları Görüntüle →
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}

            {/* No Products State */}
            {!loadingProducts && !productsError && featuredProducts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-primary-700 mb-2">
                  Henüz öne çıkan ürün bulunmuyor
                </h3>
                <p className="text-primary-500 mb-6">
                  Öne çıkan ürünler eklendiğinde burada görünecek.
                </p>
                <Link
                  to="/urunler"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-scientific-blue-500 to-accent-gold-500 text-white rounded-lg hover:from-scientific-blue-600 hover:to-accent-gold-600 transition-all duration-200 font-medium"
                >
                  <span>Tüm Ürünleri Görüntüle</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                  </svg>
                </Link>
              </div>
            )}

            {/* View All Products Button */}
            {!loadingProducts && !productsError && featuredProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                viewport={{ once: true }}
                className="text-center mt-12"
              >
                <Link
                  to="/urunler"
                  className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-scientific-blue-500 to-accent-gold-500 text-white rounded-xl hover:from-scientific-blue-600 hover:to-accent-gold-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl text-lg"
                >
                  <span>Tüm Ürünleri Görüntüle</span>
                  <motion.svg
                    whileHover={{ x: 3 }}
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
                  </motion.svg>
                </Link>
              </motion.div>
            )}
          </div>
        </section>

      {/* Statistics Section */}
      <section className="section-padding bg-glass-white backdrop-blur-sm">
        <div className="container-responsive">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-gradient text-3xl font-bold mb-12">
              {t('stats.title')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { number: "15+", label: t('stats.experience'), delay: 0.1 },
                { number: "500+", label: t('stats.projects'), delay: 0.2 },
                { number: "50+", label: t('stats.experts'), delay: 0.3 },
                { number: "1000+", label: t('stats.customers'), delay: 0.4 }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: stat.delay }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="text-neon-gradient text-5xl font-bold mb-2">
                    {stat.number}
                  </div>
                  <div className="text-primary-600 text-lg font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

        {/* CTA Section */}
        <section className="section-padding">
          <div className="container-responsive">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-gradient text-4xl font-bold mb-6">
              {t('cta.ready_title')}
            </h2>
            <p className="text-primary-600 text-lg max-w-2xl mx-auto mb-8">
              {t('cta.ready_subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="btn-primary">
                {t('cta.get_started')}
              </button>
              <button className="btn-secondary">
                {t('cta.learn_more')}
              </button>
            </div>
            </motion.div>
          </div>
        </section>
      </div>
    </motion.div>
  )
}

export default Home

// Status indicator
console.log('🚀 Home: Using PostgreSQL Backend (Firebase removed)')