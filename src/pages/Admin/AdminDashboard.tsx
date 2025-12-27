import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import AdminLayout from '../../components/AdminLayout/AdminLayout'
import { ProductsApi } from '../../services/api/productsApi'
import { CategoriesApi } from '../../services/api/categoriesApi'
import websocketService from '../../services/websocketService'
import { useSuccessNotification, useErrorNotification } from '../../components/NotificationSystem/NotificationSystem'

interface DashboardStats {
  totalProducts: number
  activeProducts: number
  lowStockProducts: number
  outOfStockProducts: number
  totalCategories: number
  recentActivities: Activity[]
}

interface Activity {
  id: string
  action: string
  productName: string
  timestamp: string
  type: 'create' | 'update' | 'delete' | 'stock'
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    totalCategories: 0,
    recentActivities: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [animatedStats, setAnimatedStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0
  })

  // Counter animation effect
  useEffect(() => {
    if (!loading && stats.totalProducts > 0) {
      const duration = 2000 // 2 seconds
      const steps = 60
      const stepDuration = duration / steps

      const animations = [
        { key: 'totalProducts', target: stats.totalProducts },
        { key: 'activeProducts', target: stats.activeProducts },
        { key: 'lowStockProducts', target: stats.lowStockProducts },
        { key: 'outOfStockProducts', target: stats.outOfStockProducts }
      ]

      animations.forEach(({ key, target }) => {
        let current = 0
        const increment = target / steps

        const timer = setInterval(() => {
          current += increment
          if (current >= target) {
            current = target
            clearInterval(timer)
          }
          setAnimatedStats(prev => ({
            ...prev,
            [key]: Math.floor(current)
          }))
        }, stepDuration)
      })
    }
  }, [loading, stats])

  const showSuccessNotification = useSuccessNotification()
  const showErrorNotification = useErrorNotification()

  // Load dashboard data from backend APIs (optimized)
  const loadDashboardData = async (isRetry: boolean = false) => {
    // Prevent infinite retry loops
    if (isRetry && retryCount >= 3) {
      console.warn('🔄 Max retry attempts reached, using fallback data')
      setError('Bağlantı sorunu nedeniyle varsayılan veriler gösteriliyor.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      console.log('🔄 Loading dashboard data...')
      
      // Parallel API calls for better performance
      const [productsResponse, categoriesResponse] = await Promise.all([
        ProductsApi.getProducts({}, { page: 1, limit: 1000 }),
        CategoriesApi.getMainCategories(true)
      ])

      console.log('📊 Products loaded:', productsResponse.pagination.total)
      console.log('📂 Categories loaded:', categoriesResponse.length)

      const products = productsResponse.data
      
      // Calculate stats from real data
      const totalProducts = productsResponse.pagination.total
      const activeProducts = products.filter(p => p.isActive).length
      const lowStockProducts = products.filter(p => p.stockQuantity <= p.minStockLevel && p.stockQuantity > 0).length
      const outOfStockProducts = products.filter(p => p.stockQuantity === 0).length
      const totalCategories = categoriesResponse.length

      // Create recent activities from recent products
      const recentActivities: Activity[] = products
        .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
        .slice(0, 5)
        .map((product, index) => ({
          id: `activity_${product.id}`,
          action: product.updatedAt !== product.createdAt ? 'Ürün güncellendi' : 'Yeni ürün eklendi',
          productName: product.name,
          timestamp: formatRelativeTime(new Date(product.updatedAt || product.createdAt)),
          type: product.updatedAt !== product.createdAt ? 'update' : 'create'
        }))

      const dashboardStats = {
        totalProducts,
        activeProducts,
        lowStockProducts,
        outOfStockProducts,
        totalCategories,
        recentActivities
      }

      setStats(dashboardStats)
      setRetryCount(0) // Reset retry count on success
      console.log('✅ Dashboard data loaded successfully:', dashboardStats)
      
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error)
      
      if (isRetry) {
        setRetryCount(prev => prev + 1)
      }
      
      // Only show popup for first attempt, not retries
      if (!isRetry && retryCount < 2) {
        showErrorNotification(
          'Dashboard Yüklenemedi',
          'Dashboard verileri yüklenirken hata oluştu. Varsayılan veriler gösteriliyor.',
          {
            label: 'Yeniden Dene',
            handler: () => {
              setRetryCount(prev => prev + 1)
              loadDashboardData(true)
            }
          }
        )
      }
      
      setError('Bağlantı sorunu nedeniyle varsayılan veriler gösteriliyor.')
      
      // Fallback to mock data
      setStats({
        totalProducts: 0,
        activeProducts: 0,
        lowStockProducts: 0,
        outOfStockProducts: 0,
        totalCategories: 0,
        recentActivities: []
      })
    } finally {
      setLoading(false)
    }
  }

  // Utility function to format relative time
  const formatRelativeTime = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Şimdi'
    if (diffMins < 60) return `${diffMins} dakika önce`
    if (diffHours < 24) return `${diffHours} saat önce`
    return `${diffDays} gün önce`
  }

  // Initial data loading and WebSocket setup
  useEffect(() => {
    // Load dashboard data
    loadDashboardData()

    // Initialize WebSocket connection for real-time updates
    const initializeWebSocket = async () => {
      try {
        const token = localStorage.getItem('authToken') || undefined
        await websocketService.connect(token)
        
        if (websocketService.connected) {
          console.log('🔌 WebSocket connected for AdminDashboard')
        }
      } catch (error) {
        console.warn('🔌 WebSocket connection failed:', error)
      }
    }

    const setupRealtimeListeners = () => {
      // Listen for product events to refresh dashboard stats
      const unsubscribeCreated = websocketService.subscribe('productCreated', (data: any) => {
        console.log('📦 Product created, refreshing dashboard...')
        loadDashboardData()
        showSuccessNotification(
          'Dashboard Güncellendi',
          `Yeni ürün "${data.product?.name}" eklendi.`,
          2000
        )
      })

      const unsubscribeUpdated = websocketService.subscribe('productUpdated', (data: any) => {
        console.log('📦 Product updated, refreshing dashboard...')
        loadDashboardData()
      })

      const unsubscribeDeleted = websocketService.subscribe('productDeleted', (data: any) => {
        console.log('📦 Product deleted, refreshing dashboard...')
        loadDashboardData()
      })

      const unsubscribeStock = websocketService.subscribe('stockUpdated', (data: any) => {
        console.log('📊 Stock updated, refreshing dashboard...')
        loadDashboardData()
      })

      const unsubscribeLowStock = websocketService.subscribe('lowStockWarning', (data: any) => {
        console.log('⚠️ Low stock warning:', data)
        showErrorNotification(
          'Düşük Stok Uyarısı!',
          `${data.product?.name} ürününün stoku kritik seviyede!`,
          {
            label: 'Stok Güncelle',
            handler: () => window.location.href = `/admin/products/${data.product?.id}/edit`
          }
        )
        // Refresh dashboard to show updated low stock count
        loadDashboardData()
      })

      return () => {
        unsubscribeCreated()
        unsubscribeUpdated()
        unsubscribeDeleted()
        unsubscribeStock()
        unsubscribeLowStock()
      }
    }

    initializeWebSocket()
    const cleanup = setupRealtimeListeners()

    return cleanup
  }, [])

  const quickActions = [
    {
      title: 'Yeni Ürün Ekle',
      description: 'Yeni kimyasal ürün ekleyin',
      icon: '🧪',
      link: '/admin/products/add',
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      title: 'Ürünleri Görüntüle',
      description: 'Tüm ürünleri listeleyin',
      icon: '📋',
      link: '/admin/products',
      gradient: 'from-emerald-500 to-green-600'
    },
    {
      title: 'Stok Yönetimi',
      description: 'Stok seviyelerini kontrol edin',
      icon: '📦',
      link: '/admin/inventory',
      gradient: 'from-purple-500 to-violet-600'
    },
    {
      title: 'Kategori Yönetimi',
      description: 'Kategorileri düzenleyin',
      icon: '🗂️',
      link: '/admin/categories',
      gradient: 'from-orange-500 to-red-600'
    }
  ]

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'create': return '➕'
      case 'update': return '✏️'
      case 'delete': return '🗑️'
      case 'stock': return '📦'
      default: return '📝'
    }
  }

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'create': return 'text-green-600'
      case 'update': return 'text-blue-600'
      case 'delete': return 'text-red-600'
      case 'stock': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Dashboard" breadcrumb={[{ label: 'Dashboard' }]}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-300 border-t-indigo-600 mb-4"></div>
            <p className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-medium">Dashboard yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="Dashboard"
      breadcrumb={[{ label: 'Dashboard' }]}
    >
      <div className="space-y-6">
        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/70 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-white/20"
        >
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Kimyalab Yönetim Paneline Hoş Geldiniz
          </h2>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Sistem durumu: <span className={error ? "text-amber-600 font-medium" : "text-emerald-600 font-medium"}>
                {error ? "Kısmi Bağlantı" : "Çevrimiçi"}
              </span> •
              Son güncelleme: <span className="font-medium">Şimdi</span>
            </p>
            {error && (
              <button
                onClick={() => loadDashboardData()}
                className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg transition-colors duration-200"
              >
                🔄 Yenile
              </button>
            )}
          </div>
          {error && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-sm">⚠️ {error}</p>
            </div>
          )}
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Toplam Ürün</p>
                <motion.p
                  className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  {animatedStats.totalProducts}
                </motion.p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">🧪</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Aktif Ürün</p>
                <motion.p
                  className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                >
                  {animatedStats.activeProducts}
                </motion.p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Düşük Stok</p>
                <motion.p
                  className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7, type: "spring" }}
                >
                  {animatedStats.lowStockProducts}
                </motion.p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20 hover:shadow-2xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-2">Stokta Yok</p>
                <motion.p
                  className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                >
                  {animatedStats.outOfStockProducts}
                </motion.p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">❌</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">Hızlı İşlemler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className="block group"
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className={`bg-gradient-to-br ${action.gradient} text-white rounded-2xl p-6 transition-all duration-300 shadow-xl hover:shadow-2xl group-hover:shadow-xl`}
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{action.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                  <p className="text-sm opacity-90">{action.description}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20"
          >
            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">Son Aktiviteler</h3>
            <div className="space-y-4">
              {stats.recentActivities.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-center space-x-4 p-4 rounded-xl bg-white/50 hover:bg-white/70 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg">
                    <span className="text-lg">{getActivityIcon(activity.type)}</span>
                  </div>
                  <div className="flex-1">
                    <div className={`font-semibold ${getActivityColor(activity.type)}`}>
                      {activity.action}
                    </div>
                    <div className="text-sm text-gray-600">{activity.productName}</div>
                    <div className="text-xs text-gray-500">{activity.timestamp}</div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-white/20">
              <Link
                to="/admin/activities"
                className="text-indigo-600 hover:text-purple-600 font-semibold text-sm transition-colors duration-200"
              >
                Tüm aktiviteleri görüntüle →
              </Link>
            </div>
          </motion.div>

          {/* System Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20"
          >
            <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">Sistem Bilgisi</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/20">
                <span className="text-gray-600">Toplam Kategori</span>
                <span className="font-bold text-gray-800">{stats.totalCategories}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/20">
                <span className="text-gray-600">Admin Kullanıcı</span>
                <span className="font-bold text-gray-800">Admin</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/20">
                <span className="text-gray-600">Son Giriş</span>
                <span className="font-bold text-gray-800">Şimdi</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Sistem Durumu</span>
                <span className="font-bold text-emerald-600">Çevrimiçi</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/20">
              <h4 className="font-bold text-gray-700 mb-4">Hızlı Bağlantılar</h4>
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/admin/products"
                  className="text-sm text-indigo-600 hover:text-purple-600 py-2 px-3 rounded-lg bg-white/50 hover:bg-white/70 transition-all duration-200"
                >
                  Ürün Yönetimi
                </Link>
                <Link
                  to="/admin/categories"
                  className="text-sm text-indigo-600 hover:text-purple-600 py-2 px-3 rounded-lg bg-white/50 hover:bg-white/70 transition-all duration-200"
                >
                  Kategori Yönetimi
                </Link>
                <Link
                  to="/admin/inventory"
                  className="text-sm text-indigo-600 hover:text-purple-600 py-2 px-3 rounded-lg bg-white/50 hover:bg-white/70 transition-all duration-200"
                >
                  Stok Takibi
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard