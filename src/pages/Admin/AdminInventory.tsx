import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Product } from '../../types'
import AdminLayout from '../../components/AdminLayout/AdminLayout'
import { ProductsApi } from '../../services/api/productsApi'
import { useSuccessNotification, useErrorNotification } from '../../components/NotificationSystem/NotificationSystem'
import ProductImage from '../../components/ProductImage/ProductImage'

interface InventoryItem extends Product {
  lastUpdated: string
  reorderLevel: number
  supplier: string
  leadTime: string
  totalValue: number
}

const AdminInventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'low' | 'out' | 'normal'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [updateItem, setUpdateItem] = useState<InventoryItem | null>(null)
  const [newQuantity, setNewQuantity] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const showSuccessNotification = useSuccessNotification()
  const showErrorNotification = useErrorNotification()

  // Load inventory data from PostgreSQL Backend
  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true)
        setError(null)
        
        console.log('🔄 Loading inventory data...')
        
        // Get all products with stock information
        const productsResponse = await ProductsApi.getProducts({ isActive: true }, { page: 1, limit: 1000 })
        
        console.log('📊 Products loaded for inventory:', productsResponse.pagination.total)
        
        // Transform products to inventory items - Type cast to avoid complex type issues
        const inventoryData: InventoryItem[] = productsResponse.data.map(product => ({
          ...(product as any), // Cast to avoid type issues with backend/frontend type differences
          lastUpdated: product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          reorderLevel: product.minStockLevel || 10,
          supplier: 'KimyaLab Tedarikçi',
          leadTime: '7-14 gün',
          totalValue: (typeof product.price === 'number' ? product.price : parseFloat(String(product.price)) || 0) * product.stockQuantity,
          // Ensure required fields exist
          productCode: product.code || product.id,
          brand: 'KimyaLab',
          cas: 'N/A',
          formula: 'N/A',
          purity: '>99%',
          thumbnailImage: '🧪',
          images: [],
          currency: '₺',
          stock: product.stockQuantity > 0
        }))
        
        setInventory(inventoryData)
        console.log('✅ Inventory data loaded successfully:', inventoryData.length, 'items')
        
      } catch (err) {
        console.error('❌ Error loading inventory:', err)
        setError('Stok bilgileri yüklenirken bir hata oluştu.')
        
        showErrorNotification(
          'Stok Yükleme Hatası',
          'Stok bilgileri yüklenirken hata oluştu. Varsayılan veriler gösteriliyor.',
          {
            label: 'Yeniden Dene',
            handler: () => loadInventory()
          }
        )
        
        // Fallback to empty inventory
        setInventory([])
      } finally {
        setLoading(false)
      }
    }

    loadInventory()
  }, [])

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.productCode || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesFilter = true
    if (filter === 'low') {
      matchesFilter = (item.stockQuantity || 0) <= item.reorderLevel && (item.stockQuantity || 0) > 0
    } else if (filter === 'out') {
      matchesFilter = (item.stockQuantity || 0) === 0
    } else if (filter === 'normal') {
      matchesFilter = (item.stockQuantity || 0) > item.reorderLevel
    }
    
    return matchesSearch && matchesFilter
  })

  const getStockStatus = (item: InventoryItem) => {
    const stockQuantity = item.stockQuantity || 0
    if (stockQuantity === 0) return { status: 'Stokta Yok', color: 'text-red-600 bg-red-100' }
    if (stockQuantity <= item.reorderLevel) return { status: 'Düşük Stok', color: 'text-orange-600 bg-orange-100' }
    return { status: 'Normal', color: 'text-green-600 bg-green-100' }
  }

  const handleUpdateStock = (item: InventoryItem) => {
    setUpdateItem(item)
    setNewQuantity(item.stockQuantity || 0)
    setShowUpdateModal(true)
  }

  const confirmUpdateStock = async () => {
    if (!updateItem) return
    
    try {
      console.log('🔄 Updating stock for product:', updateItem.id, 'New quantity:', newQuantity)
      
      // Update product stock via API
      await ProductsApi.updateProduct(updateItem.id, {
        stockQuantity: newQuantity
      })
      
      // Update local state
      setInventory(inventory.map(item =>
        item.id === updateItem.id
          ? {
              ...item,
              stockQuantity: newQuantity,
              stock: newQuantity > 0,
              lastUpdated: new Date().toISOString().split('T')[0],
              totalValue: (typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0) * newQuantity
            }
          : item
      ))
      
      showSuccessNotification(
        'Stok Güncellendi! ✅',
        `${updateItem.name} ürününün stok miktarı ${newQuantity} olarak güncellendi.`,
        3000
      )
      
      console.log('✅ Stock updated successfully')
      
    } catch (error) {
      console.error('❌ Error updating stock:', error)
      showErrorNotification(
        'Stok Güncelleme Hatası',
        'Stok güncellenirken bir hata oluştu.',
        {
          label: 'Tekrar Dene',
          handler: () => confirmUpdateStock()
        }
      )
    } finally {
      setShowUpdateModal(false)
      setUpdateItem(null)
      setNewQuantity(0)
    }
  }

  const handleBulkUpdate = () => {
    // Toplu işlem fonksiyonu
    console.log('Bulk update for items:', selectedItems)
  }

  const exportInventory = () => {
    // Export fonksiyonu
    const csvContent = [
      'Ürün Adı,Ürün Kodu,Stok Miktarı,Minimum Seviye,Değer,Durum',
      ...filteredInventory.map(item => {
        const { status } = getStockStatus(item)
        return `${item.name},${item.productCode},${item.stockQuantity},${item.reorderLevel},${item.totalValue}₺,${status}`
      })
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'stok-raporu.csv'
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const inventoryStats = {
    total: inventory.length,
    lowStock: inventory.filter(item => (item.stockQuantity || 0) <= item.reorderLevel && (item.stockQuantity || 0) > 0).length,
    outOfStock: inventory.filter(item => (item.stockQuantity || 0) === 0).length,
    totalValue: inventory.reduce((sum, item) => sum + item.totalValue, 0)
  }

  const breadcrumb = [
    { label: 'Stok Yönetimi', href: '/admin/inventory', current: true }
  ]

  if (loading) {
    return (
      <AdminLayout title="Stok Yönetimi" breadcrumb={breadcrumb}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-scientific-blue-300 border-t-scientific-blue-600 mb-4"></div>
            <p className="text-primary-600 font-medium">Stok bilgileri yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Stok Yönetimi" breadcrumb={breadcrumb}>
      <div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-primary-600">Ürün stoklarını takip edin ve yönetin</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={exportInventory}
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                📊 Excel'e Aktar
              </button>
              {selectedItems.length > 0 && (
                <button
                  onClick={handleBulkUpdate}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Toplu Güncelle ({selectedItems.length})
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Toplam Ürün</p>
                <p className="text-3xl font-bold text-primary-800">{inventoryStats.total}</p>
              </div>
              <div className="w-12 h-12 bg-scientific-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Düşük Stok</p>
                <p className="text-3xl font-bold text-orange-600">{inventoryStats.lowStock}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Stokta Yok</p>
                <p className="text-3xl font-bold text-red-600">{inventoryStats.outOfStock}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Toplam Değer</p>
                <p className="text-2xl font-bold text-scientific-green-600">
                  {inventoryStats.totalValue.toLocaleString()}₺
                </p>
              </div>
              <div className="w-12 h-12 bg-scientific-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white rounded-lg shadow-md p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ürün adı veya kodu ile arayın..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
              />
            </div>
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'Tümü' },
                { key: 'normal', label: 'Normal' },
                { key: 'low', label: 'Düşük Stok' },
                { key: 'out', label: 'Stokta Yok' }
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key as typeof filter)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === filterOption.key
                      ? 'bg-scientific-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Inventory Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(filteredInventory.map(item => item.id))
                        } else {
                          setSelectedItems([])
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ürün
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mevcut Stok
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min. Seviye
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Değer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Son Güncelleme
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item) => {
                  const stockStatus = getStockStatus(item)
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, item.id])
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== item.id))
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="mr-3">
                            {item.images && item.images[0] ? (
                              <ProductImage
                                src={item.images[0].url}
                                alt={item.images[0].alt || item.name}
                                className="w-8 h-8"
                              />
                            ) : (
                              <div className="text-2xl">🧪</div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.productCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {item.stockQuantity || 0} adet
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.reorderLevel} adet
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.totalValue.toLocaleString()}₺
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.price}₺ x {item.stockQuantity || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                          {stockStatus.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.lastUpdated).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleUpdateStock(item)}
                          className="text-scientific-blue-600 hover:text-scientific-blue-900"
                        >
                          Güncelle
                        </button>
                        <Link
                          to={`/urun/${item.id}`}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Görüntüle
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Update Stock Modal */}
        {showUpdateModal && updateItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
            >
              <h2 className="text-xl font-bold text-primary-800 mb-4">
                Stok Güncelle
              </h2>
              
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-900 mb-2">
                  {updateItem.name}
                </div>
                <div className="text-xs text-gray-500 mb-4">
                  Mevcut: {updateItem.stockQuantity || 0} adet
                </div>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Yeni Miktar
                </label>
                <input
                  type="number"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                  min="0"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  onClick={confirmUpdateStock}
                  className="px-4 py-2 bg-scientific-blue-500 text-white rounded-lg hover:bg-scientific-blue-600"
                >
                  Güncelle
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminInventory