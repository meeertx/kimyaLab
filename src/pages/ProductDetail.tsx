import React, { useState, useMemo, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useParams, Link } from 'react-router-dom'
// Firebase removed - using PostgreSQL Backend
import { Product, Category } from '../types'

// Services
import { ProductService, CategoryService, InventoryService } from '../services/productService'

// Hooks
import { useSEO, generateProductStructuredData, injectStructuredData } from '../hooks/useSEO'

// Components
import Molecules3D from '../components/Molecules3D/Molecules3D'
import ProductImage from '../components/ProductImage/ProductImage'

// Services
import {
  downloadCertificate,
  downloadCertificateBundle,
  previewCertificate,
  getCertificateInfo,
  getLanguageFlag,
  getLanguageName,
  trackDownload
} from '../services/certificateService'

const ProductDetail: React.FC = () => {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  })

  // Parallax effects
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3])

  const { productId } = useParams<{ productId: string }>()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [downloadingCertificate, setDownloadingCertificate] = useState<string | null>(null)
  const [downloadingBundle, setDownloadingBundle] = useState(false)
  
  // PostgreSQL Backend state
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [inventory, setInventory] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // SEO - Always call hook, but conditionally set values
  useSEO({
    title: product?.name || 'Ürün Detayları',
    description: product
      ? `${product.name} - ${product.brand || 'KimyaLab'} markası ${product.cas || ''} CAS numaralı ürün. ${product.description || ''}`
      : 'KimyaLab ürün detayları sayfası',
    keywords: product
      ? [product.name, product.brand || 'KimyaLab', product.cas || '', product.formula || '', ...(product.tags || [])]
      : ['kimya', 'laboratuvar', 'ürün'],
    type: 'product'
  })

  // Floating animation variants for molecules
  const moleculeFloatingVariants = useMemo(() => ({
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
  }), [])

  const tabs = useMemo(() => [
    { key: 'description', label: t('products.tabs.description') },
    { key: 'specifications', label: t('products.tabs.specifications') },
    { key: 'applications', label: t('products.tabs.applications') },
    { key: 'documents', label: t('products.tabs.documents') }
  ], [t])

  // PostgreSQL Backend data subscriptions (polling-based)
  useEffect(() => {
    if (!productId) {
      setLoading(false)
      setError('Ürün ID bulunamadı')
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    // Subscribe to product updates (polling-based)
    const productUnsubscribe = ProductService.subscribeToProduct(productId, (productData) => {
      if (!isMounted) return
      
      if (!productData) {
        setError('Ürün bulunamadı')
        setLoading(false)
        return
      }
      
      console.log('🔄 ProductDetail: Product data received:', !!productData)
      setProduct(productData)
      
      // Get category info when product is loaded/updated
      if (productData.category) {
        CategoryService.getCategories().then(categories => {
          if (!isMounted) return
          const productCategory = categories.find(cat => cat.id === productData.category)
          setCategory(productCategory || null)
        }).catch(categoryError => {
          console.error('❌ Error loading category:', categoryError)
        })
      }

      setLoading(false)
    })

    // Subscribe to inventory updates (polling-based)
    const inventoryUnsubscribe = InventoryService.subscribeToInventory(productId, (inventoryData) => {
      if (!isMounted) return
      setInventory(inventoryData)
    })

    // Subscribe to all products for related products calculation
    const productsUnsubscribe = ProductService.subscribeToProducts(
      undefined, // No filters needed for related products
      (allProducts: Product[]) => {
        if (!isMounted) return
        const currentProduct = allProducts.find((p: Product) => p.id === productId)
        if (currentProduct) {
          const related = allProducts.filter((p: Product) =>
            p.id !== productId &&
            p.category === currentProduct.category
          ).slice(0, 3)
          setRelatedProducts(related)
        }
      },
      100 // Get more products to find related ones
    )

    // Cleanup subscriptions on unmount or productId change
    return () => {
      isMounted = false
      if (productUnsubscribe) productUnsubscribe()
      if (inventoryUnsubscribe) inventoryUnsubscribe()
      if (productsUnsubscribe) productsUnsubscribe()
    }
  }, [productId])

  // Inject product structured data
  useEffect(() => {
    if (product) {
      injectStructuredData(generateProductStructuredData(product), 'product-data')
    }
  }, [product])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-gradient-to-br from-primary-50 via-scientific-blue-50 to-scientific-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-scientific-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-primary-800 mb-2">Ürün yükleniyor...</h2>
          <p className="text-primary-600">Lütfen bekleyiniz</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !product) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-gradient-to-br from-primary-50 via-scientific-blue-50 to-scientific-green-50">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-primary-800 mb-4">
            {error || t('products.product_not_found')}
          </h1>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="mr-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Yeniden Dene
            </button>
            <Link to="/urunler" className="px-6 py-2 bg-scientific-blue-500 text-white rounded-lg hover:bg-scientific-blue-600 transition-colors">
              {t('products.back_to_products')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Certificate download handler
  const handleCertificateDownload = async (
    certificateType: 'SDS' | 'COA' | 'MSDS',
    language: 'tr' | 'en' | 'ar'
  ) => {
    if (!product || downloadingCertificate) return
    
    const downloadKey = `${certificateType}-${language}`
    setDownloadingCertificate(downloadKey)
    
    try {
      const success = await downloadCertificate(
        product.id,
        product.productCode || product.code || product.id.slice(-8).toUpperCase(),
        certificateType,
        language
      )
      
      if (success) {
        trackDownload(product.id, certificateType, language, 'single')
      }
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setDownloadingCertificate(null)
    }
  }

  // Bundle download handler
  const handleBundleDownload = async (
    bundleType: 'single-language' | 'all-languages',
    language?: 'tr' | 'en' | 'ar'
  ) => {
    if (!product || downloadingBundle) return
    
    setDownloadingBundle(true)
    
    try {
      const success = await downloadCertificateBundle(
        product.id,
        product.productCode || product.code || product.id.slice(-8).toUpperCase(),
        bundleType,
        language
      )
      
      if (success) {
        console.log('Bundle downloaded successfully')
      }
    } catch (error) {
      console.error('Bundle download failed:', error)
    } finally {
      setDownloadingBundle(false)
    }
  }

  // Certificate preview handler
  const handleCertificatePreview = (
    certificateType: 'SDS' | 'COA' | 'MSDS',
    language: 'tr' | 'en' | 'ar'
  ) => {
    if (!product) return
    
    previewCertificate(
      product.id,
      product.productCode || product.code || product.id.slice(-8).toUpperCase(),
      certificateType,
      language
    )
    
    trackDownload(product.id, certificateType, language, 'single')
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
          className="absolute top-32 right-12 w-15 h-15 opacity-12"
        >
          <div className="relative">
            <div className="w-3 h-3 bg-scientific-blue-400 rounded-full absolute top-0 left-0 animate-pulse" />
            <div className="w-2 h-2 bg-scientific-green-400 rounded-full absolute top-4 left-3 animate-pulse animation-delay-200" />
            <div className="absolute top-1 left-1 w-3 h-0.5 bg-gradient-to-r from-scientific-blue-400 to-scientific-green-400 rotate-45 opacity-60" />
          </div>
        </motion.div>

        <motion.div
          variants={moleculeFloatingVariants}
          animate="animate"
          className="absolute bottom-32 left-20 w-12 h-12 opacity-15"
          style={{ animationDelay: '4s' }}
        >
          <div className="relative">
            <div className="w-2 h-2 bg-purple-400 rounded-full absolute top-0 left-0 animate-pulse" />
            <div className="w-3 h-3 bg-pink-400 rounded-full absolute top-2 left-2 animate-pulse animation-delay-400" />
            <div className="absolute top-1 left-1 w-2 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 -rotate-30 opacity-60" />
          </div>
        </motion.div>

        <motion.div
          variants={moleculeFloatingVariants}
          animate="animate"
          className="absolute top-60 left-1/3 w-14 h-14 opacity-10"
          style={{ animationDelay: '6s' }}
        >
          <div className="relative">
            <div className="w-2 h-2 bg-accent-gold-400 rounded-full absolute top-0 left-1 animate-pulse" />
            <div className="w-3 h-3 bg-orange-400 rounded-full absolute top-3 left-3 animate-pulse animation-delay-300" />
            <div className="w-2 h-2 bg-yellow-400 rounded-full absolute top-1 left-4 animate-pulse animation-delay-600" />
            <div className="absolute top-1 left-2 w-2 h-0.5 bg-gradient-to-r from-accent-gold-400 to-orange-400 rotate-60 opacity-60" />
            <div className="absolute top-2 left-3 w-1 h-0.5 bg-gradient-to-r from-orange-400 to-yellow-400 -rotate-45 opacity-60" />
          </div>
        </motion.div>
      </div>
      
      <div className="container-responsive relative z-10">
        
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center space-x-2 text-sm text-primary-600 mb-8"
        >
          <Link to="/" className="hover:text-scientific-blue-500">{t('nav.home')}</Link>
          <span>/</span>
          <Link to="/urunler" className="hover:text-scientific-blue-500">{t('nav.products')}</Link>
          <span>/</span>
          <Link to={`/kategori/${category?.slug || 'kimyasallar'}`} className="hover:text-scientific-blue-500">
            {category?.name || t('products.category')}
          </Link>
          <span>/</span>
          <span className="text-primary-800 font-medium">{product.name}</span>
        </motion.nav>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          
          {/* Product Images */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="card-3d p-8 mb-6">
              <div className="text-center">
                <div className="text-8xl mb-6">
                  {product.images && product.images[selectedImage] ? (
                    <ProductImage
                      src={product.images[selectedImage].url}
                      alt={product.images[selectedImage].alt || product.name}
                      className="w-24 h-24 mx-auto"
                    />
                  ) : (
                    '🧪'
                  )}
                </div>
                <div className="space-y-2">
                  <div className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
                    (inventory?.stock || product.stock)
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {(inventory?.stock || product.stock) ? t('products.in_stock') : t('products.out_of_stock')}
                  </div>
                  
                  {inventory && (
                    <div className="flex items-center justify-center space-x-2 text-xs text-primary-600">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      <span>Canlı stok takibi aktif</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="flex space-x-3 justify-center">
                {product.images.map((image, index: number) => (
                  <button
                    key={image.id || index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center text-2xl transition-all ${
                      selectedImage === index
                        ? 'border-scientific-blue-500 bg-scientific-blue-50'
                        : 'border-glass-medium bg-glass-light hover:border-scientific-blue-300'
                    }`}
                    title={image.alt || `Image ${index + 1}`}
                  >
                    {typeof image === 'object' && image?.url ? (
                      <ProductImage
                        src={image.url}
                        alt={image.alt || product.name}
                        className="w-12 h-12"
                      />
                    ) : (
                      '🧪'
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-gradient text-3xl lg:text-4xl font-bold mb-4">
              {product.name}
            </h1>
            
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-primary-600">{t('products.labels.brand')}: <strong>{product.brand}</strong></span>
              <span className="text-primary-600">{t('products.labels.cas')}: <strong>{product.cas}</strong></span>
            </div>

            <div className="text-3xl font-bold text-scientific-blue-600 mb-6">
              {product.currency}{product.price}
            </div>

            {/* Enhanced Product Info */}
            <div className="card-3d p-6 mb-8">
              <h3 className="text-lg font-bold text-primary-800 mb-4 flex items-center">
                <span className="mr-2">🧪</span>
                {t('products.product_info')}
              </h3>
              
              {/* Technical Specifications from Backend */}
              {product.technicalSpecs && product.technicalSpecs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-4">
                  {product.technicalSpecs.map((spec, index) => (
                    <div key={index} className="bg-gradient-to-r from-scientific-blue-50 to-primary-50 p-3 rounded-lg border border-scientific-blue-100">
                      <span className="text-scientific-blue-600 font-medium text-xs uppercase tracking-wide">
                        {spec.name}:
                      </span>
                      <div className="font-bold text-primary-800 mt-1">
                        {spec.value}{spec.unit && ` ${spec.unit}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Fallback to basic info if no technical specs */
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-primary-500">{t('products.formula')}:</span>
                    <div className="font-medium text-primary-800">{product.formula || 'Belirtilmemiş'}</div>
                  </div>
                  <div>
                    <span className="text-primary-500">{t('products.molecular_weight')}:</span>
                    <div className="font-medium text-primary-800">{product.molecularWeight || 'Belirtilmemiş'}</div>
                  </div>
                  <div>
                    <span className="text-primary-500">{t('products.purity')}:</span>
                    <div className="font-medium text-primary-800">{product.purity || 'Belirtilmemiş'}</div>
                  </div>
                </div>
              )}
              
              {/* Stock Information - Always show */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-primary-500 font-medium">{t('products.stock')}:</span>
                  <div className={`font-bold text-right ${product.stock ? 'text-green-600' : 'text-red-600'}`}>
                    {inventory ? (
                      <>
                        {inventory.stock ? `${inventory.stockQuantity} ${t('products.units_available')}` : t('products.out_of_stock')}
                        {inventory.minStockLevel && inventory.stockQuantity <= inventory.minStockLevel && (
                          <div className="text-xs text-orange-500 mt-1">
                            ⚠️ Düşük stok seviyesi (Min: {inventory.minStockLevel})
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {product.stock ? `${product.stockQuantity} ${t('products.units_available')}` : t('products.out_of_stock')}
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Additional Product Metadata */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-primary-500">Ürün Kodu:</span>
                    <span className="font-medium text-primary-800">{product.code || product.id?.slice(-8).toUpperCase() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-500">Kategori:</span>
                    <span className="font-medium text-primary-800">{category?.name || product.category || 'Belirtilmemiş'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-500">Birim:</span>
                    <span className="font-medium text-primary-800">{product.unit || 'kg'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-primary-500">Para Birimi:</span>
                    <span className="font-medium text-primary-800">{product.currency || 'TRY'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="flex items-center space-x-4 mb-8">
              <div className="flex items-center border border-glass-medium rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-glass-light transition-colors"
                >
                  -
                </button>
                <span className="px-6 py-2 border-x border-glass-medium">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-glass-light transition-colors"
                >
                  +
                </button>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 btn-neon"
                disabled={!product.stock}
              >
                {t('products.add_to_cart')}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-lg bg-glass-light hover:bg-glass-medium transition-colors"
              >
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </motion.button>
            </div>

            {/* Chemical Certificates Section */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-primary-800 mb-4 flex items-center">
                <span className="mr-2">📋</span>
                Kimyasal Sertifikalar
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* SDS Certificate */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCertificateDownload('SDS', 'tr')}
                  disabled={downloadingCertificate === 'SDS-tr'}
                  className="group p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border-2 border-red-200 hover:border-red-300 transition-all duration-300 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">SDS</span>
                      </div>
                      <span className="font-semibold text-red-700">Güvenlik Bilgi Formu</span>
                    </div>
                    <motion.svg
                      className="w-5 h-5 text-red-500 group-hover:translate-y-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </motion.svg>
                  </div>
                  <div className="text-xs text-red-600 text-left">
                    <div>🇹🇷 Türkçe • PDF • 2.3 MB</div>
                    <div className="mt-1 opacity-75">
                      {downloadingCertificate === 'SDS-tr' ? 'İndiriliyor...' : 'Güvenlik ve kullanım bilgileri'}
                    </div>
                  </div>
                </motion.button>

                {/* COA Certificate */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCertificateDownload('COA', 'en')}
                  disabled={downloadingCertificate === 'COA-en'}
                  className="group p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">COA</span>
                      </div>
                      <span className="font-semibold text-blue-700">Analiz Sertifikası</span>
                    </div>
                    <motion.svg
                      className="w-5 h-5 text-blue-500 group-hover:translate-y-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </motion.svg>
                  </div>
                  <div className="text-xs text-blue-600 text-left">
                    <div>🇺🇸 English • PDF • 1.8 MB</div>
                    <div className="mt-1 opacity-75">
                      {downloadingCertificate === 'COA-en' ? 'İndiriliyor...' : 'Kalite analiz sonuçları'}
                    </div>
                  </div>
                </motion.button>

                {/* MSDS Certificate */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCertificateDownload('MSDS', 'en')}
                  disabled={downloadingCertificate === 'MSDS-en'}
                  className="group p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 hover:border-green-300 transition-all duration-300 disabled:opacity-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">MSDS</span>
                      </div>
                      <span className="font-semibold text-green-700">Malzeme Güvenlik Formu</span>
                    </div>
                    <motion.svg
                      className="w-5 h-5 text-green-500 group-hover:translate-y-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </motion.svg>
                  </div>
                  <div className="text-xs text-green-600 text-left">
                    <div>🇺🇸 English • PDF • 2.1 MB</div>
                    <div className="mt-1 opacity-75">
                      {downloadingCertificate === 'MSDS-en' ? 'İndiriliyor...' : 'Detaylı güvenlik bilgileri'}
                    </div>
                  </div>
                </motion.button>
              </div>

              {/* Multi-language Download Options */}
              <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">Diğer Diller:</span>
                      <div className="flex space-x-2">
                        <span className="px-2 py-1 bg-white rounded-md text-xs font-medium text-gray-600 border">🇹🇷 TR</span>
                        <span className="px-2 py-1 bg-white rounded-md text-xs font-medium text-gray-600 border">🇺🇸 EN</span>
                        <span className="px-2 py-1 bg-white rounded-md text-xs font-medium text-gray-600 border">🇸🇦 AR</span>
                      </div>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={() => handleBundleDownload('all-languages')}
                    disabled={downloadingBundle}
                    className="text-xs px-3 py-2 bg-gradient-to-r from-scientific-blue-500 to-indigo-500 text-white rounded-lg font-medium hover:from-scientific-blue-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50"
                  >
                    {downloadingBundle ? 'Hazırlanıyor...' : 'Tümünü İndir (.zip)'}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                className="btn-secondary flex-1"
              >
                {t('products.get_quote')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                className="btn-secondary flex-1"
              >
                {t('products.technical_support')}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-16"
        >
          {/* Tab Headers */}
          <div className="border-b border-glass-medium mb-8">
            <div className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`pb-4 font-medium transition-colors relative ${
                    activeTab === tab.key
                      ? 'text-scientific-blue-600'
                      : 'text-primary-600 hover:text-scientific-blue-500'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-scientific-blue-600"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[300px]">
            {activeTab === 'description' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-lg text-primary-600 leading-relaxed">
                  {product.description}
                </p>
              </motion.div>
            )}

            {activeTab === 'specifications' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid md:grid-cols-2 gap-6"
              >
                {product.specifications && Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-3 border-b border-glass-light">
                    <span className="text-primary-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="font-medium text-primary-800">{value}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'applications' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid md:grid-cols-2 gap-4"
              >
                {product.applications && product.applications.map((app: string, index: number) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-scientific-blue-500 rounded-full"></div>
                    <span className="text-primary-600">{app}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'documents' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Chemical Certificates Section */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-primary-800 mb-6 flex items-center">
                    <span className="mr-3">🧪</span>
                    Kimyasal Sertifikalar ve Güvenlik Belgeleri
                  </h3>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* SDS Documents */}
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border border-red-100">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center mr-3">
                          <span className="text-white font-bold text-sm">SDS</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-red-800">Safety Data Sheet</h4>
                          <p className="text-sm text-red-600">Güvenlik Bilgi Formu</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {['tr', 'en', 'ar'].map((lang) => (
                          <motion.button
                            key={`sds-${lang}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              const link = document.createElement('a')
                              link.href = '#'
                              link.download = `SDS-${product.productCode}-${lang.toUpperCase()}.pdf`
                              link.click()
                            }}
                            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-red-200 hover:border-red-300 transition-colors group"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">
                                {lang === 'tr' ? '🇹🇷' : lang === 'en' ? '🇺🇸' : '🇸🇦'}
                              </span>
                              <div className="text-left">
                                <div className="text-sm font-medium text-red-800">
                                  {lang === 'tr' ? 'Türkçe' : lang === 'en' ? 'English' : 'العربية'}
                                </div>
                                <div className="text-xs text-red-600">PDF • 2.3 MB</div>
                              </div>
                            </div>
                            <motion.svg
                              className="w-5 h-5 text-red-500 group-hover:translate-y-1 transition-transform"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" />
                            </motion.svg>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* COA Documents */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-3">
                          <span className="text-white font-bold text-sm">COA</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-blue-800">Certificate of Analysis</h4>
                          <p className="text-sm text-blue-600">Analiz Sertifikası</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {['tr', 'en', 'ar'].map((lang) => (
                          <motion.button
                            key={`coa-${lang}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              const link = document.createElement('a')
                              link.href = '#'
                              link.download = `COA-${product.productCode}-${lang.toUpperCase()}.pdf`
                              link.click()
                            }}
                            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors group"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">
                                {lang === 'tr' ? '🇹🇷' : lang === 'en' ? '🇺🇸' : '🇸🇦'}
                              </span>
                              <div className="text-left">
                                <div className="text-sm font-medium text-blue-800">
                                  {lang === 'tr' ? 'Türkçe' : lang === 'en' ? 'English' : 'العربية'}
                                </div>
                                <div className="text-xs text-blue-600">PDF • 1.8 MB</div>
                              </div>
                            </div>
                            <motion.svg
                              className="w-5 h-5 text-blue-500 group-hover:translate-y-1 transition-transform"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" />
                            </motion.svg>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* MSDS Documents */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                      <div className="flex items-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-3">
                          <span className="text-white font-bold text-sm">MSDS</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-green-800">Material Safety Data Sheet</h4>
                          <p className="text-sm text-green-600">Malzeme Güvenlik Formu</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {['tr', 'en', 'ar'].map((lang) => (
                          <motion.button
                            key={`msds-${lang}`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              const link = document.createElement('a')
                              link.href = '#'
                              link.download = `MSDS-${product.productCode}-${lang.toUpperCase()}.pdf`
                              link.click()
                            }}
                            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-green-200 hover:border-green-300 transition-colors group"
                          >
                            <div className="flex items-center space-x-3">
                              <span className="text-lg">
                                {lang === 'tr' ? '🇹🇷' : lang === 'en' ? '🇺🇸' : '🇸🇦'}
                              </span>
                              <div className="text-left">
                                <div className="text-sm font-medium text-green-800">
                                  {lang === 'tr' ? 'Türkçe' : lang === 'en' ? 'English' : 'العربية'}
                                </div>
                                <div className="text-xs text-green-600">PDF • 2.1 MB</div>
                              </div>
                            </div>
                            <motion.svg
                              className="w-5 h-5 text-green-500 group-hover:translate-y-1 transition-transform"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" />
                            </motion.svg>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bulk Download Options */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl border border-indigo-100">
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-3 md:space-y-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-indigo-800">Toplu İndirme</h4>
                          <p className="text-sm text-indigo-600">Tüm sertifikaları tek seferde indirin</p>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 text-sm"
                        >
                          Türkçe (.zip - 6.2 MB)
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 text-sm"
                        >
                          English (.zip - 6.2 MB)
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 text-sm"
                        >
                          Tümü (.zip - 18.6 MB)
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Other Documents */}
                {product.documents && product.documents.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-primary-800 mb-4 flex items-center">
                      <span className="mr-2">📄</span>
                      Diğer Dökümanlar
                    </h3>
                    <div className="space-y-4">
                      {product.documents.map((doc, _) => (
                        <div key={doc.id} className="card-3d p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <span className="text-gray-600 font-bold text-xs">{doc.type}</span>
                            </div>
                            <div>
                              <div className="font-medium text-primary-800">{doc.name}</div>
                              <div className="text-sm text-primary-500">{doc.size}</div>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn-secondary"
                            onClick={() => window.open(doc.url, '_blank')}
                          >
                            {t('products.download')}
                          </motion.button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Related Products */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <h2 className="text-gradient text-3xl font-bold mb-8 text-center">
            {t('products.similar_products')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedProducts.map((relatedProduct: Product, index: number) => (
              <motion.div
                key={relatedProduct.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                whileHover={{ y: -5 }}
                className="card-3d p-6 text-center group"
              >
                <Link to={`/urun/${relatedProduct.id}`}>
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {relatedProduct.images && relatedProduct.images[0] ? (
                      <ProductImage
                        src={relatedProduct.images[0].url}
                        alt={relatedProduct.images[0].alt || relatedProduct.name}
                        className="w-16 h-16 mx-auto"
                      />
                    ) : (
                      '🧪'
                    )}
                  </div>
                  <h3 className="text-primary-800 font-bold mb-2 group-hover:text-scientific-blue-600 transition-colors">
                    {relatedProduct.name}
                  </h3>
                  <div className="text-scientific-blue-600 font-bold">
                    {relatedProduct.currency}{relatedProduct.price}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default ProductDetail

// Status indicator
console.log('🚀 ProductDetail: Using PostgreSQL Backend (Firebase removed)')