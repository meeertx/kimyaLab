import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Category, Product } from '../types'

// Services
import { ProductService, CategoryService } from '../services/productService'

// Hooks
import { useSEO } from '../hooks/useSEO'

// Components
import Molecules3D from '../components/Molecules3D/Molecules3D'
import ProductImage from '../components/ProductImage/ProductImage'

const CategoryPage: React.FC = () => {
  const { t } = useTranslation()
  const { categorySlug } = useParams<{ categorySlug: string }>()
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  
  // State
  const [products, setProducts] = useState<Product[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'newest'>('name')
  const [priceFilter, setPriceFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Scroll effects - only apply when ready
  const [isScrollReady, setIsScrollReady] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setIsScrollReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
    layoutEffect: false
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3])

  // SEO
  useSEO({
    title: category ? `${category.name} - Kimya Laboratuvarı Ürünleri` : 'Kategori - Kimya Laboratuvarı',
    description: category ? category.description : 'Kimya laboratuvarı ürün kategorisi',
    keywords: ['kimyasal ürünler', 'laboratuvar', 'kimya', ...(category?.name ? [category.name] : [])],
    type: 'website'
  })

  // Load category and products
  useEffect(() => {
    const loadCategoryData = async () => {
      if (!categorySlug) return
      
      try {
        setLoading(true)
        setError(null)
        
        console.log('🔄 Loading category:', categorySlug)
        
        // Load category info and products in parallel
        const [categoryData, productsData] = await Promise.all([
          CategoryService.getCategories(),
          ProductService.getProductsByCategory(categorySlug)
        ])
        
        // Find the specific category
        const foundCategory = categoryData.find((cat: Category) => cat.slug === categorySlug)
        
        if (!foundCategory) {
          throw new Error('Category not found')
        }
        
        setCategory(foundCategory)
        setProducts(productsData)
        
        console.log('✅ Loaded category:', foundCategory.name, 'with', productsData.length, 'products')
        
      } catch (err: any) {
        console.error('❌ Error loading category data:', err)
        setError(err.message || 'Kategori yüklenirken bir hata oluştu.')
        setCategory(null)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    loadCategoryData()
  }, [categorySlug])

  // Filter and sort products
  const filteredAndSortedProducts = React.useMemo(() => {
    let filtered = [...products]

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(search) ||
        (product.brand || '').toLowerCase().includes(search) ||
        (product.cas || '').toLowerCase().includes(search) ||
        (product.code || '').toLowerCase().includes(search)
      )
    }

    // Apply price filter
    if (priceFilter !== 'all') {
      filtered = filtered.filter(product => {
        const price = typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0)
        switch (priceFilter) {
          case 'low': return price < 500
          case 'medium': return price >= 500 && price < 2000
          case 'high': return price >= 2000
          default: return true
        }
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'tr')
        case 'price':
          const priceA = typeof a.price === 'string' ? parseFloat(a.price) : (a.price || 0)
          const priceB = typeof b.price === 'string' ? parseFloat(b.price) : (b.price || 0)
          return priceA - priceB
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [products, searchTerm, priceFilter, sortBy])

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

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative min-h-screen pt-24 pb-12 overflow-hidden"
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-scientific-blue-50 to-scientific-green-50" />
        
        {/* 3D Molecules Background */}
        {isScrollReady && (
          <motion.div
            style={{ y, opacity }}
            className="absolute inset-0 opacity-30"
          >
            <Molecules3D height="200vh" />
          </motion.div>
        )}
        
        <div className="container-responsive relative z-10">
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-scientific-blue-500 border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-xl text-primary-600">Kategori yükleniyor...</p>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  if (error || !category) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative min-h-screen pt-24 pb-12 overflow-hidden"
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50" />
        
        <div className="container-responsive relative z-10">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-primary-800 mb-4">
              {error || 'Kategori bulunamadı'}
            </h1>
            <p className="text-primary-600 mb-8">
              Aradığınız kategori mevcut değil veya geçici bir sorun yaşanıyor.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => navigate('/urunler')}
                className="px-6 py-3 bg-gradient-to-r from-scientific-blue-500 to-accent-gold-500 text-white rounded-lg hover:from-scientific-blue-600 hover:to-accent-gold-600 transition-all duration-200 font-medium"
              >
                Ürünler Sayfasına Dön
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-white text-primary-700 border-2 border-primary-300 rounded-lg hover:bg-primary-50 transition-all duration-200 font-medium"
              >
                Yeniden Dene
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

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
      
      {/* 3D Molecules Background */}
      {isScrollReady && (
        <motion.div
          style={{ y, opacity }}
          className="absolute inset-0 opacity-30"
        >
          <Molecules3D height="200vh" />
        </motion.div>
      )}
      
      {/* Additional floating CSS molecules */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
      </div>
      
      <div className="container-responsive relative z-10">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center items-center space-x-3 mb-6 text-sm text-primary-500"
          >
            <Link to="/" className="hover:text-primary-700 transition-colors">
              Ana Sayfa
            </Link>
            <span>•</span>
            <Link to="/urunler" className="hover:text-primary-700 transition-colors">
              Ürünler
            </Link>
            <span>•</span>
            <span className="text-primary-700 font-medium">{category.name}</span>
          </motion.div>

          {/* Category Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="text-8xl mb-6"
          >
            {category.icon}
          </motion.div>

          <h1 className="text-gradient text-4xl lg:text-6xl font-bold mb-6">
            {category.name}
          </h1>
          
          <p className="text-xl text-primary-600 max-w-4xl mx-auto leading-relaxed">
            {category.description}
          </p>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="card-3d p-6 mb-12"
        >
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ürün ara..."
                className="w-full px-4 py-3 pl-12 rounded-xl bg-white/90 backdrop-blur-md border-2 border-white/30 focus:outline-none focus:border-scientific-blue-400 focus:ring-2 focus:ring-scientific-blue-400/20 transition-all duration-300"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-3 rounded-xl bg-white/90 backdrop-blur-md border-2 border-white/30 focus:outline-none focus:border-scientific-blue-400 transition-all duration-300"
            >
              <option value="name">İsme Göre</option>
              <option value="price">Fiyata Göre</option>
              <option value="newest">Yenilere Göre</option>
            </select>

            {/* Price Filter */}
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value as any)}
              className="w-full px-4 py-3 rounded-xl bg-white/90 backdrop-blur-md border-2 border-white/30 focus:outline-none focus:border-scientific-blue-400 transition-all duration-300"
            >
              <option value="all">Tüm Fiyatlar</option>
              <option value="low">500₺ Altı</option>
              <option value="medium">500₺ - 2000₺</option>
              <option value="high">2000₺ Üstü</option>
            </select>

            {/* Results Count */}
            <div className="flex items-center justify-center">
              <span className="text-sm font-medium text-primary-600">
                <strong className="text-scientific-blue-600">{filteredAndSortedProducts.length}</strong> ürün bulundu
              </span>
            </div>
          </div>
        </motion.div>

        {/* Products Grid */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {filteredAndSortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {filteredAndSortedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="card-3d p-6 group cursor-pointer"
                  >
                    <Link to={`/urun/${product.id}`} className="block">
                      {/* Product Image/Icon */}
                      <div className="text-center mb-4">
                        <div className="group-hover:scale-110 transition-transform duration-300">
                          <ProductImage
                            src={product.images?.[0]?.url}
                            alt={product.name}
                            className="w-16 h-16 mx-auto rounded-lg object-cover"
                            placeholderClassName="w-16 h-16 mx-auto rounded-lg"
                          />
                        </div>
                      </div>
                      
                      {/* Product Info */}
                      <div className="text-center">
                        <h3 className="text-gradient text-lg font-bold mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                        
                        <div className="space-y-2 text-sm text-primary-600 mb-4">
                          <div className="flex justify-between">
                            <span>Marka:</span>
                            <span className="font-medium">{product.brand || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Kod:</span>
                            <span className="font-medium">{product.code || '-'}</span>
                          </div>
                          {product.cas && (
                            <div className="flex justify-between">
                              <span>CAS:</span>
                              <span className="font-medium">{product.cas}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Price and Stock */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-lg font-bold text-scientific-blue-600">
                            {product.price ? `${product.price} ${product.currency || '₺'}` : 'Fiyat belirtilmemiş'}
                          </div>
                          <div className={`px-2 py-1 text-xs rounded-full font-medium ${
                            product.stockQuantity && product.stockQuantity > 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {product.stockQuantity && product.stockQuantity > 0 ? 'Stokta' : 'Stok Yok'}
                          </div>
                        </div>

                        {/* View Button */}
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          className="mt-4"
                        >
                          <div className="w-full py-2 bg-gradient-to-r from-scientific-blue-500 to-accent-gold-500 text-white rounded-lg text-sm font-medium group-hover:from-scientific-blue-600 group-hover:to-accent-gold-600 transition-all duration-200 flex items-center justify-center space-x-2">
                            <span>Detayları Gör</span>
                            <motion.svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              whileHover={{ x: 3 }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </motion.svg>
                          </div>
                        </motion.div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="text-6xl mb-6">🔍</div>
              <h3 className="text-2xl font-bold text-primary-700 mb-4">
                {searchTerm || priceFilter !== 'all' 
                  ? 'Arama kriterlerinize uygun ürün bulunamadı'
                  : 'Bu kategoride henüz ürün bulunmuyor'}
              </h3>
              <p className="text-primary-500 mb-8 max-w-md mx-auto">
                {searchTerm || priceFilter !== 'all'
                  ? 'Farklı arama terimleri veya filtreler deneyebilirsiniz.'
                  : 'Yakında yeni ürünler eklenecek. Daha sonra tekrar kontrol ediniz.'}
              </p>
              
              {(searchTerm || priceFilter !== 'all') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => {
                    setSearchTerm('')
                    setPriceFilter('all')
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-scientific-blue-500 to-accent-gold-500 text-white rounded-lg hover:from-scientific-blue-600 hover:to-accent-gold-600 transition-all duration-200 font-medium"
                >
                  Filtreleri Temizle
                </motion.button>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Category Stats */}
        {filteredAndSortedProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="mt-20 bg-gradient-to-r from-scientific-blue-50 to-scientific-green-50 rounded-3xl p-12"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gradient mb-8">
                {category.name} Kategorisi
              </h2>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  {
                    number: filteredAndSortedProducts.length.toString(),
                    label: "Toplam Ürün"
                  },
                  {
                    number: filteredAndSortedProducts.filter(p => p.stock).length.toString(),
                    label: "Stokta Olan"
                  },
                  {
                    number: new Set(filteredAndSortedProducts.map(p => p.brand)).size.toString(),
                    label: "Farklı Marka"
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
                    transition={{ duration: 0.6, delay: 1.3 + index * 0.1 }}
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
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default CategoryPage

// Status indicator
console.log('🚀 CategoryPage: Using PostgreSQL Backend with Beautiful Design (Firebase removed)')