import React from 'react'
import { motion } from 'framer-motion'

interface StockPricingSectionProps {
  formData: {
    price?: number
    currency?: string
    stockQuantity?: number
    minStockLevel?: number
    stock?: boolean
    isActive?: boolean
    featured?: boolean
  }
  onInputChange: (field: string, value: any) => void
  loading?: boolean
}

const StockPricingSection: React.FC<StockPricingSectionProps> = React.memo(({
  formData,
  onInputChange,
  loading = false
}) => {
  const handlePriceChange = (value: string) => {
    const numericValue = parseFloat(value) || 0
    onInputChange('price', numericValue)
  }

  const handleStockQuantityChange = (value: string) => {
    const numericValue = parseInt(value) || 0
    onInputChange('stockQuantity', numericValue)
    // Auto-update stock status based on quantity
    onInputChange('stock', numericValue > 0)
  }

  const handleMinStockLevelChange = (value: string) => {
    const numericValue = parseInt(value) || 0
    onInputChange('minStockLevel', numericValue)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="bg-white rounded-lg shadow-md p-6"
    >
      <h2 className="text-xl font-bold text-primary-800 mb-4">Stok ve Fiyatlandırma</h2>
      
      <div className="grid md:grid-cols-4 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fiyat *
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price || ''}
              onChange={(e) => handlePriceChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500 transition-colors"
              disabled={loading}
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-500 text-sm">
                {formData.currency === 'TRY' ? '₺' :
                 formData.currency === 'USD' ? '$' :
                 formData.currency === 'EUR' ? '€' : '₺'}
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Para Birimi
          </label>
          <select
            value={formData.currency || 'TRY'}
            onChange={(e) => onInputChange('currency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500 transition-colors"
            disabled={loading}
          >
            <option value="TRY">₺ TRY</option>
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stok Miktarı
          </label>
          <input
            type="number"
            min="0"
            value={formData.stockQuantity || ''}
            onChange={(e) => handleStockQuantityChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500 transition-colors"
            disabled={loading}
            placeholder="0"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min. Stok Seviyesi
          </label>
          <input
            type="number"
            min="0"
            value={formData.minStockLevel || ''}
            onChange={(e) => handleMinStockLevelChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500 transition-colors"
            disabled={loading}
            placeholder="10"
          />
          <p className="text-xs text-gray-500 mt-1">
            Bu seviyenin altında uyarı verilir
          </p>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Ürün Durumu</h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="stock-status"
                checked={formData.stock || false}
                onChange={(e) => onInputChange('stock', e.target.checked)}
                className="h-4 w-4 text-scientific-blue-600 focus:ring-scientific-blue-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="stock-status" className="ml-2 block text-sm text-gray-900">
                Stokta var
              </label>
            </div>
            <div className="text-xs text-gray-500">
              {formData.stockQuantity || 0} adet mevcut
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="active-status"
                checked={formData.isActive || false}
                onChange={(e) => onInputChange('isActive', e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="active-status" className="ml-2 block text-sm text-gray-900">
                Aktif
              </label>
            </div>
            <div className="text-xs text-gray-500">
              {formData.isActive ? 'Sitede görünür' : 'Sitede gizli'}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="featured-status"
                checked={formData.featured || false}
                onChange={(e) => onInputChange('featured', e.target.checked)}
                className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                disabled={loading}
              />
              <label htmlFor="featured-status" className="ml-2 block text-sm text-gray-900">
                Öne çıkarılmış
              </label>
            </div>
            <div className="text-xs text-gray-500">
              {formData.featured ? 'Ana sayfada gösterilir' : 'Normal listeleme'}
            </div>
          </div>
        </div>
      </div>

      {/* Stock Alert */}
      {formData.stockQuantity !== undefined && formData.minStockLevel !== undefined && 
       formData.stockQuantity <= formData.minStockLevel && formData.stockQuantity > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <div className="flex items-center">
            <div className="text-yellow-400 mr-2">⚠️</div>
            <div className="text-sm text-yellow-800">
              <strong>Düşük Stok Uyarısı:</strong> Stok miktarı minimum seviyeye yaklaştı. 
              Yeni sipariş vermeyi düşünün.
            </div>
          </div>
        </motion.div>
      )}

      {/* Out of Stock Alert */}
      {formData.stockQuantity === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
        >
          <div className="flex items-center">
            <div className="text-red-400 mr-2">🚫</div>
            <div className="text-sm text-red-800">
              <strong>Stok Tükendi:</strong> Bu ürün şu anda stokta bulunmuyor. 
              Yeni sipariş vermeden önce tedarikçi ile iletişime geçin.
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
})

StockPricingSection.displayName = 'StockPricingSection'

export default StockPricingSection