import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Product } from '../../types'
import { ProductsApi, BackendProduct } from '../../services/api/productsApi'
import { CategoriesApi, BackendCategory } from '../../services/api/categoriesApi'
import websocketService from '../../services/websocketService'
import { useSuccessNotification, useErrorNotification } from '../NotificationSystem/NotificationSystem'
import ProductImage from '../ProductImage/ProductImage'
// Virtualization temporarily disabled due to react-window import issue
import { debounce } from 'lodash-es'

interface OptimizedProductListProps {
  onProductSelect?: (product: Product) => void
  showActions?: boolean
  pageSize?: number
  enableVirtualization?: boolean
  className?: string
}

interface ProductRowProps {
  index: number
  style: React.CSSProperties
  data: {
    products: Product[]
    onEdit: (productId: string) => void
    onDelete: (productId: string) => void
    onToggleStatus: (productId: string) => void
  }
}

// Memoized Product Row Component for virtual scrolling
const ProductRow: React.FC<ProductRowProps> = React.memo(({ index, style, data }) => {
  const { products, onEdit, onDelete, onToggleStatus } = data
  const product = products[index]

  if (!product) return null

  return (
    <div style={style}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between p-4 bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors"
      >
        {/* Product Info */}
        <div className="flex items-center flex-1">
          <div className="text-2xl mr-3 flex-shrink-0">
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
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {product.name}
            </div>
            <div className="text-sm text-gray-500 truncate">
              {product.productCode} • {product.cas}
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="hidden md:block px-4">
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {product.category}
          </span>
        </div>

        {/* Stock */}
        <div className="hidden lg:block px-4">
          <div className="text-sm text-gray-900">{product.stockQuantity}</div>
          <div className={`text-xs ${product.stock ? 'text-green-600' : 'text-red-600'}`}>
            {product.stock ? 'Stokta' : 'Yok'}
          </div>
        </div>

        {/* Price */}
        <div className="hidden xl:block px-4">
          <div className="text-sm text-gray-900">
            {product.price} {product.currency}
          </div>
        </div>

        {/* Status */}
        <div className="px-4">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            product.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {product.isActive ? 'Aktif' : 'Pasif'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 flex-shrink-0">
          <Link
            to={`/urun/${product.id}`}
            className="text-scientific-blue-600 hover:text-scientific-blue-900 text-sm"
          >
            Görüntüle
          </Link>
          <button
            onClick={() => onEdit(product.id)}
            className="text-green-600 hover:text-green-900 text-sm"
          >
            Düzenle
          </button>
          <button
            onClick={() => onToggleStatus(product.id)}
            className={`text-sm ${
              product.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'
            }`}
          >
            {product.isActive ? 'Pasif' : 'Aktif'}
          </button>
          <button
            onClick={() => onDelete(product.id)}
            className="text-red-600 hover:text-red-900 text-sm"
          >
            Sil
          </button>
        </div>
      </motion.div>
    </div>
  )
})

ProductRow.displayName = 'ProductRow'

const OptimizedProductList: React.FC<OptimizedProductListProps> = ({
  pageSize = 50,
  enableVirtualization = true,
  className = ''
}) => {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<BackendCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)

  const unsubscribeRef = useRef<(() => void) | null>(null)
  const showSuccessNotification = useSuccessNotification()
  const showErrorNotification = useErrorNotification()

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((term: string) => {
      applyFilters(products, term, selectedCategory, sortBy)
    }, 300),
    [products, selectedCategory, sortBy]
  )

  // Apply filters and sorting
  const applyFilters = useCallback((
    productList: Product[], 
    search: string, 
    category: string, 
    sort: string
  ) => {
    let filtered = [...productList]

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.productCode?.toLowerCase().includes(searchLower) ||
        product.cas?.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower)
      )
    }

    // Apply category filter
    if (category) {
      filtered = filtered.filter(product => product.category === category)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'code':
          return (a.productCode || '').localeCompare(b.productCode || '')
        case 'stock':
          return (b.stockQuantity || 0) - (a.stockQuantity || 0)
        case 'price':
          const aPrice = typeof a.price === 'string' ? parseFloat(a.price) : a.price
          const bPrice = typeof b.price === 'string' ? parseFloat(b.price) : b.price
          return aPrice - bPrice
        case 'updated':
          const bDate = b.updatedAt || b.createdAt || new Date().toISOString()
          const aDate = a.updatedAt || a.createdAt || new Date().toISOString()
          return new Date(bDate).getTime() - new Date(aDate).getTime()
        default:
          return 0
      }
    })

    setFilteredProducts(filtered)
    setTotalPages(Math.ceil(filtered.length / pageSize))
    
    // Reset scroll position when filters change - disabled due to virtualization being off
    // if (listRef.current) {
    //   listRef.current.scrollToItem(0, 'start')
    // }
  }, [pageSize])

  // Fetch categories for filter dropdown
  const loadCategories = async () => {
    try {
      const data = await CategoriesApi.getMainCategories(true)
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  // Fetch products from backend API with pagination and filtering
  const loadProducts = async (
    page: number = 1,
    search: string = '',
    category: string = '',
    sort: string = 'createdAt'
  ) => {
    setLoading(true)
    try {
      // Build filters for API call
      const filters: any = {
        isActive: true // Only show active products by default
      }
      
      if (search.trim()) {
        filters.search = search.trim()
      }
      
      if (category) {
        // Find category name from ID
        const categoryObj = categories.find(cat => cat.id === category)
        if (categoryObj) {
          filters.category = categoryObj.slug
        }
      }

      // Build pagination
      const pagination = {
        page,
        limit: pageSize,
        sortBy: sort,
        sortOrder: (sort === 'createdAt' ? 'desc' : 'asc') as 'asc' | 'desc'
      }

      console.log('🔍 Loading products with filters:', filters, 'pagination:', pagination)

      // Fetch products from PostgreSQL backend
      const response = await ProductsApi.getProducts(filters, pagination)
      
      // Convert backend products to frontend format
      const frontendProducts = response.data.map(ProductsApi.convertToFrontendProduct)
      
      setProducts(frontendProducts)
      setFilteredProducts(frontendProducts)
      setTotalProducts(response.pagination.total)
      setTotalPages(response.pagination.pages)
      setCurrentPage(page)
      
      console.log(`✅ Loaded ${frontendProducts.length} products (${response.pagination.total} total)`)
      
    } catch (error) {
      console.error('❌ Error loading products:', error)
      showErrorNotification(
        'Ürünler Yüklenemedi',
        'Ürünler yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin.',
        {
          label: 'Yeniden Dene',
          handler: () => loadProducts(page, search, category, sort)
        }
      )
    } finally {
      setLoading(false)
    }
  }

  // Initial data loading
  useEffect(() => {
    Promise.all([
      loadCategories(),
      loadProducts(1, searchTerm, selectedCategory, sortBy)
    ])
  }, [])

  // WebSocket real-time updates
  useEffect(() => {
    const initializeWebSocket = async () => {
      try {
        const token = localStorage.getItem('authToken') || undefined
        await websocketService.connect(token)
        
        if (websocketService.connected) {
          console.log('🔌 WebSocket connected for OptimizedProductList')
        }
      } catch (error) {
        console.warn('🔌 WebSocket connection failed:', error)
      }
    }

    const setupRealtimeListeners = () => {
      // Listen for product created events
      const unsubscribeCreated = websocketService.subscribe('productCreated', (data: any) => {
        console.log('📦 Real-time product created, refreshing list...')
        loadProducts(currentPage, searchTerm, selectedCategory, sortBy)
        
        showSuccessNotification(
          'Yeni Ürün Eklendi! 🎉',
          `${data.product?.name} ürünü listeye eklendi.`,
          3000
        )
      })

      // Listen for product updated events
      const unsubscribeUpdated = websocketService.subscribe('productUpdated', (data: any) => {
        console.log('📦 Real-time product updated, refreshing list...')
        loadProducts(currentPage, searchTerm, selectedCategory, sortBy)
      })

      // Listen for product deleted events
      const unsubscribeDeleted = websocketService.subscribe('productDeleted', (data: any) => {
        console.log('📦 Real-time product deleted, refreshing list...')
        loadProducts(currentPage, searchTerm, selectedCategory, sortBy)
        
        showSuccessNotification(
          'Ürün Silindi',
          `${data.productName} ürünü listeden kaldırıldı.`,
          3000
        )
      })

      // Listen for stock updates
      const unsubscribeStock = websocketService.subscribe('stockUpdated', (data: any) => {
        console.log('📊 Real-time stock updated, refreshing list...')
        loadProducts(currentPage, searchTerm, selectedCategory, sortBy)
      })

      return () => {
        unsubscribeCreated()
        unsubscribeUpdated()
        unsubscribeDeleted()
        unsubscribeStock()
      }
    }

    initializeWebSocket()
    const cleanup = setupRealtimeListeners()

    return cleanup
  }, [currentPage, searchTerm, selectedCategory, sortBy, showSuccessNotification])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
      debouncedSearch.cancel()
    }
  }, [])

  // Handle search with debouncing - now triggers API call
  const debouncedApiCall = useMemo(
    () => debounce((search: string, category: string, sort: string) => {
      loadProducts(1, search, category, sort)
    }, 500),
    [categories]
  )

  useEffect(() => {
    debouncedApiCall(searchTerm, selectedCategory, sortBy)
    return () => debouncedApiCall.cancel()
  }, [searchTerm, selectedCategory, sortBy, debouncedApiCall])

  // Action handlers
  const handleEdit = useCallback((productId: string) => {
    window.location.href = `/admin/products/edit/${productId}`
  }, [])

  const handleDelete = useCallback(async (productId: string) => {
    if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
      try {
        await ProductsApi.deleteProduct(productId)
        showSuccessNotification(
          'Ürün Silindi',
          'Ürün başarıyla silindi.',
          2000
        )
        // Real-time listener will refresh the list
      } catch (error) {
        console.error('Error deleting product:', error)
        showErrorNotification(
          'Silme Hatası',
          'Ürün silinirken hata oluştu. Lütfen tekrar deneyin.',
          {
            label: 'Tekrar Dene',
            handler: () => handleDelete(productId)
          }
        )
      }
    }
  }, [showSuccessNotification, showErrorNotification])

  const handleToggleStatus = useCallback(async (productId: string) => {
    try {
      const product = products.find(p => p.id === productId)
      if (product) {
        // Find corresponding backend product format
        const updateData = {
          isActive: !product.isActive
        }
        
        await ProductsApi.updateProduct(productId, updateData)
        showSuccessNotification(
          'Durum Güncellendi',
          `Ürün ${updateData.isActive ? 'aktif' : 'pasif'} duruma getirildi.`,
          2000
        )
        // Real-time listener will refresh the list
      }
    } catch (error) {
      console.error('Error updating product status:', error)
      showErrorNotification(
        'Güncelleme Hatası',
        'Ürün durumu güncellenirken hata oluştu.',
        {
          label: 'Tekrar Dene',
          handler: () => handleToggleStatus(productId)
        }
      )
    }
  }, [products, showSuccessNotification, showErrorNotification])

  // Get current page products (already paginated from API)
  const getCurrentPageProducts = useMemo(() => {
    return filteredProducts
  }, [filteredProducts])

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Loading Skeleton */}
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="animate-pulse flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-300 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
              <div className="w-20 h-6 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ürün ara... (isim, kod, CAS)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
            />
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
            >
              <option value="name">İsme Göre</option>
              <option value="code">Koda Göre</option>
              <option value="stockQuantity">Stoka Göre</option>
              <option value="price">Fiyata Göre</option>
              <option value="createdAt">Ekleme Tarihine Göre</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              <strong>{totalProducts}</strong> ürün bulundu
              {loading && <span className="text-scientific-blue-500 ml-2">Yükleniyor...</span>}
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                Sayfa {currentPage} / {totalPages}
              </span>
              {totalPages > 1 && (
                <button
                  onClick={() => loadProducts(Math.max(1, currentPage - 1), searchTerm, selectedCategory, sortBy)}
                  disabled={currentPage === 1 || loading}
                  className="px-2 py-1 text-sm bg-gray-100 rounded disabled:opacity-50"
                >
                  ← Önceki
                </button>
              )}
              {totalPages > 1 && (
                <button
                  onClick={() => loadProducts(Math.min(totalPages, currentPage + 1), searchTerm, selectedCategory, sortBy)}
                  disabled={currentPage === totalPages || loading}
                  className="px-2 py-1 text-sm bg-gray-100 rounded disabled:opacity-50"
                >
                  Sonraki →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Ürünler</span>
            <div className="hidden lg:flex space-x-8 text-xs text-gray-500">
              <span>Kategori</span>
              <span>Stok</span>
              <span className="hidden xl:block">Fiyat</span>
              <span>Durum</span>
              <span>İşlemler</span>
            </div>
          </div>
        </div>

        {/* Virtualized List disabled, using Regular List only */}
        {false ? (
          // Virtualization temporarily disabled
          <div>Virtualization disabled</div>
        ) : (
          <div className="divide-y divide-gray-200">
            <AnimatePresence>
              {getCurrentPageProducts.map((product, index) => (
                <ProductRow
                  key={product.id}
                  index={index}
                  style={{}}
                  data={{
                    products: getCurrentPageProducts,
                    onEdit: handleEdit,
                    onDelete: handleDelete,
                    onToggleStatus: handleToggleStatus
                  }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <div className="text-gray-600">
              {searchTerm || selectedCategory ? 'Arama kriterlerinize uygun ürün bulunamadı' : 'Henüz ürün eklenmemiş'}
            </div>
          </div>
        )}
      </div>

      {/* Advanced Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-3">
          <button
            onClick={() => loadProducts(1, searchTerm, selectedCategory, sortBy)}
            disabled={currentPage === 1 || loading}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
          >
            ⮞ İlk
          </button>
          <button
            onClick={() => loadProducts(Math.max(1, currentPage - 1), searchTerm, selectedCategory, sortBy)}
            disabled={currentPage === 1 || loading}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            ← Önceki
          </button>
          <span className="px-4 py-2 bg-scientific-blue-500 text-white rounded-lg font-medium">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => loadProducts(Math.min(totalPages, currentPage + 1), searchTerm, selectedCategory, sortBy)}
            disabled={currentPage === totalPages || loading}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Sonraki →
          </button>
          <button
            onClick={() => loadProducts(totalPages, searchTerm, selectedCategory, sortBy)}
            disabled={currentPage === totalPages || loading}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
          >
            Son ⮜
          </button>
        </div>
      )}
    </div>
  )
}

export default OptimizedProductList