import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useSearchParams, Link } from 'react-router-dom'
import { Product, Category } from '../types'

// Services
import { ProductService, CategoryService } from '../services/productService'

// Hooks
import { useSEO } from '../hooks/useSEO'

// Components
import Molecules3D from '../components/Molecules3D/Molecules3D'
import ProductImage from '../components/ProductImage/ProductImage'

const SearchResults: React.FC = () => {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  })

  // Parallax effects
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3])

  const [searchParams] = useSearchParams()
  const [sortBy, setSortBy] = useState('relevance')
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)

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

  const query = searchParams.get('q') || ''
  const categorySlug = searchParams.get('category') || ''

  // Get category info
  const category = useMemo(() => {
    return categorySlug ? categories.find(cat => cat.slug === categorySlug) : null
  }, [categorySlug, categories])

  // Load data and perform search
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Load categories first
        const categoriesData = await CategoryService.getCategories()
        setCategories(categoriesData)
        
        // Perform search
        let searchResults: Product[] = []
        
        if (query) {
          searchResults = await ProductService.searchProducts(query)
        } else {
          // If no query, get all products
          const allProductsResponse = await ProductService.getProducts()
          searchResults = allProductsResponse.products || []
        }
        
        // Filter by category if specified
        if (categorySlug && categoriesData.length > 0) {
          const foundCategory = categoriesData.find(cat => cat.slug === categorySlug)
          if (foundCategory) {
            searchResults = await ProductService.getProductsByCategory(foundCategory.id)
          }
        }
        
        setResults(searchResults)
        
      } catch (err) {
        console.error('Error loading search results:', err)
        setError('Arama sonuçları yüklenirken bir hata oluştu.')
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [query, categorySlug])

  // Sort results
  const sortedResults = useMemo(() => {
    const sorted = [...results]
    
    switch (sortBy) {
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'price':
        sorted.sort((a, b) => {
          const aPrice = typeof a.price === 'string' ? parseFloat(a.price) : a.price
          const bPrice = typeof b.price === 'string' ? parseFloat(b.price) : b.price
          return aPrice - bPrice
        })
        break
      case 'brand':
        sorted.sort((a, b) => (a.brand || '').localeCompare(b.brand || ''))
        break
      default:
        // Keep original order for relevance
        break
    }
    
    return sorted
  }, [results, sortBy])

  // SEO
  useSEO({
    title: query ? `"${query}" - Arama Sonuçları` : 'Arama Sonuçları',
    description: query
      ? `"${query}" aramanız için ${sortedResults.length} sonuç bulundu. Kimyalab ürün kataloğunda aradığınız ürünleri keşfedin.`
      : 'Kimyalab ürün kataloğunda arama yapın. İhtiyacınız olan kimyasal, laboratuvar ve analiz ürünlerini bulun.',
    keywords: query ? [query, 'arama', 'ürünler', 'kimyasal', 'laboratuvar'] : ['arama', 'ürünler', 'kimyasal', 'laboratuvar'],
    type: 'website'
  })

  const sortResults = (criteria: string) => {
    setSortBy(criteria)
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-scientific-blue-300 border-t-scientific-blue-600 mb-4"></div>
          <p className="text-primary-600 font-medium">{t('common.loading')}</p>
        </div>
      </div>
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
          className="absolute top-32 right-16 w-14 h-14 opacity-12"
        >
          <div className="relative">
            <div className="w-3 h-3 bg-scientific-green-400 rounded-full absolute top-0 left-0 animate-pulse" />
            <div className="w-2 h-2 bg-scientific-blue-400 rounded-full absolute top-3 left-4 animate-pulse animation-delay-300" />
            <div className="absolute top-1 left-1 w-3 h-0.5 bg-gradient-to-r from-scientific-green-400 to-scientific-blue-400 rotate-30 opacity-60" />
          </div>
        </motion.div>

        <motion.div
          variants={moleculeFloatingVariants}
          animate="animate"
          className="absolute bottom-40 left-12 w-12 h-12 opacity-15"
          style={{ animationDelay: '4s' }}
        >
          <div className="relative">
            <div className="w-2 h-2 bg-purple-400 rounded-full absolute top-0 left-0 animate-pulse" />
            <div className="w-3 h-3 bg-pink-400 rounded-full absolute top-2 left-2 animate-pulse animation-delay-500" />
            <div className="absolute top-1 left-1 w-2 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 -rotate-45 opacity-60" />
          </div>
        </motion.div>

        <motion.div
          variants={moleculeFloatingVariants}
          animate="animate"
          className="absolute top-64 right-1/4 w-16 h-16 opacity-10"
          style={{ animationDelay: '6s' }}
        >
          <div className="relative">
            <div className="w-2 h-2 bg-accent-gold-400 rounded-full absolute top-0 left-2 animate-pulse" />
            <div className="w-3 h-3 bg-accent-pink-400 rounded-full absolute top-4 left-0 animate-pulse animation-delay-200" />
            <div className="w-2 h-2 bg-accent-lavender-400 rounded-full absolute top-2 left-4 animate-pulse animation-delay-700" />
            <div className="absolute top-2 left-1 w-3 h-0.5 bg-gradient-to-r from-accent-gold-400 to-accent-pink-400 rotate-60 opacity-60" />
          </div>
        </motion.div>
      </div>
      
      <div className="container-responsive relative z-10">
        
        {/* Search Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-gradient text-3xl lg:text-4xl font-bold mb-4">
            Arama Sonuçları
          </h1>
          
          {query && (
            <p className="text-lg text-primary-600 mb-2">
              "<strong>{query}</strong>" için arama sonuçları
            </p>
          )}
          
          {category && (
            <p className="text-primary-500">
              Kategori: <strong>{category.name}</strong>
            </p>
          )}
          
          <div className="text-primary-500 text-sm mt-2">
            {sortedResults.length} ürün bulundu
          </div>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-red-50 border border-red-200 rounded-xl p-6 text-center mb-8"
          >
            <div className="text-red-500 text-4xl mb-2">⚠️</div>
            <p className="text-red-700 font-medium mb-3">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Yeniden Dene
            </button>
          </motion.div>
        )}

        {!error && sortedResults.length === 0 ? (
          // No Results
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-6">🔍</div>
            <h2 className="text-2xl font-bold text-primary-800 mb-4">
              {t('products.no_results')}
            </h2>
            <p className="text-primary-600 mb-8 max-w-2xl mx-auto">
              Aradığınız ürün bulunamadı. Lütfen farklı anahtar kelimeler deneyin veya kategorileri inceleyin.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/urunler" className="btn-neon">
                Tüm Ürünleri Görüntüle
              </Link>
              <Link to="/" className="btn-secondary">
                Ana Sayfaya Dön
              </Link>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Sort and Filter Bar */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0"
            >
              <div className="text-primary-600">
                <strong>{sortedResults.length}</strong> ürün bulundu
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="text-primary-600 font-medium">Sırala:</label>
                <select
                  value={sortBy}
                  onChange={(e) => sortResults(e.target.value)}
                  className="px-4 py-2 rounded-lg bg-glass-light border border-glass-medium focus:outline-none focus:border-scientific-blue-400"
                >
                  <option value="relevance">İlgili</option>
                  <option value="name">İsme Göre</option>
                  <option value="price">Fiyata Göre</option>
                  <option value="brand">Markaya Göre</option>
                </select>
              </div>
            </motion.div>

            {/* Search Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedResults.map((product: Product, index: number) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  className="card-3d p-6 group"
                >
                  <Link to={`/urun/${product.id}`}>
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                        {product.images && product.images[0] ? (
                          <ProductImage
                            src={product.images[0].url}
                            alt={product.images[0].alt || product.name}
                            className="w-16 h-16 mx-auto"
                          />
                        ) : (
                          '🧪'
                        )}
                      </div>
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        product.stock
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stock ? t('products.in_stock') : t('products.out_of_stock')}
                      </div>
                    </div>
                    
                    <h3 className="text-primary-800 font-bold text-lg mb-2 group-hover:text-scientific-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    
                    <div className="space-y-1 text-sm text-primary-600 mb-4">
                      <div><strong>Kategori:</strong> {
                        categories.find(cat => cat.id === product.category)?.name || 'Kategori'
                      }</div>
                      <div><strong>Marka:</strong> {product.brand}</div>
                      <div><strong>Ürün Kodu:</strong> {product.productCode}</div>
                      <div><strong>CAS:</strong> {product.cas}</div>
                      <div><strong>Formül:</strong> {product.formula}</div>
                      <div><strong>Saflık:</strong> {product.purity}</div>
                      {product.searchableFields?.serialNumber && (
                        <div><strong>Seri No:</strong> {product.searchableFields.serialNumber}</div>
                      )}
                      {product.searchableFields?.modelNumber && (
                        <div><strong>Model No:</strong> {product.searchableFields.modelNumber}</div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-scientific-blue-600 font-bold text-lg">
                        {product.currency}{product.price}
                      </span>
                      
                      <div className="flex space-x-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 rounded-lg bg-scientific-blue-500 text-white hover:bg-scientific-blue-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 6.5M7 13l2.5 6.5m0 0h8m-8 0h8" />
                          </svg>
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 rounded-lg bg-glass-light text-primary-600 hover:bg-glass-medium transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </motion.button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex justify-center mt-12"
            >
              <div className="flex space-x-2">
                {[1, 2, 3].map((page) => (
                  <button
                    key={page}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${
                      page === 1 
                        ? 'bg-scientific-blue-500 text-white' 
                        : 'bg-glass-light text-primary-600 hover:bg-glass-medium'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Search Suggestions */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mt-16 text-center"
            >
              <h2 className="text-2xl font-bold text-primary-800 mb-6">
                Popüler Aramalar
              </h2>
              
              <div className="flex flex-wrap justify-center gap-3">
                {['Sodium Chloride', 'HCl', 'Buffer', 'Amino Acids', 'Ethanol'].map((term, index) => (
                  <Link
                    key={index}
                    to={`/arama?q=${encodeURIComponent(term)}`}
                    className="px-4 py-2 bg-glass-light hover:bg-scientific-blue-50 rounded-full text-primary-600 hover:text-scientific-blue-600 transition-all duration-200"
                  >
                    {term}
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  )
}

export default SearchResults