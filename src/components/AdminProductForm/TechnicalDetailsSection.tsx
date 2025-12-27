import React from 'react'
import { motion } from 'framer-motion'

interface TechnicalDetailsSectionProps {
  formData: {
    unit?: string
    molecularWeight?: string
    purity?: string
    grade?: string
    specifications?: {
      appearance?: string
      color?: string
      state?: string
    }
    rawTechnicalSpecs?: Array<{name: string, unit?: string, value: string}>
  }
  onInputChange: (field: string, value: any) => void
  onNestedInputChange: (parentField: string, field: string, value: any) => void
  loading?: boolean
}

const TechnicalDetailsSection: React.FC<TechnicalDetailsSectionProps> = React.memo(({
  formData,
  onInputChange,
  onNestedInputChange,
  loading = false
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-white rounded-lg shadow-md p-6"
    >
      <h2 className="text-xl font-bold text-primary-800 mb-4">Teknik Detaylar</h2>
      
      <div className="grid md:grid-cols-4 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Birim *
          </label>
          <select
            value={formData.unit || 'kg'}
            onChange={(e) => onInputChange('unit', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500 transition-colors"
            disabled={loading}
          >
            <option value="kg">kg</option>
            <option value="g">g</option>
            <option value="mg">mg</option>
            <option value="L">L</option>
            <option value="mL">mL</option>
            <option value="adet">adet</option>
            <option value="kutu">kutu</option>
            <option value="şişe">şişe</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Moleküler Ağırlık
          </label>
          <input
            type="text"
            value={formData.molecularWeight || ''}
            onChange={(e) => onInputChange('molecularWeight', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500 transition-colors"
            disabled={loading}
            placeholder="Örn: 58.44 g/mol"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Saflık
          </label>
          <input
            type="text"
            value={formData.purity || ''}
            onChange={(e) => onInputChange('purity', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500 transition-colors"
            disabled={loading}
            placeholder="Örn: ≥99%"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kalite Derecesi
          </label>
          <input
            type="text"
            value={formData.grade || ''}
            onChange={(e) => onInputChange('grade', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500 transition-colors"
            disabled={loading}
            placeholder="Örn: Analytical Grade"
          />
        </div>
      </div>

      {/* Specifications Section */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Fiziksel Özellikler</h3>
        
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Görünüm
            </label>
            <input
              type="text"
              value={formData.specifications?.appearance || ''}
              onChange={(e) => onNestedInputChange('specifications', 'appearance', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500 transition-colors"
              disabled={loading}
              placeholder="Örn: Kristal toz"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Renk
            </label>
            <input
              type="text"
              value={formData.specifications?.color || ''}
              onChange={(e) => onNestedInputChange('specifications', 'color', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500 transition-colors"
              disabled={loading}
              placeholder="Örn: Beyaz"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fiziksel Hal
            </label>
            <select
              value={formData.specifications?.state || 'solid'}
              onChange={(e) => onNestedInputChange('specifications', 'state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500 transition-colors"
              disabled={loading}
            >
              <option value="solid">Katı</option>
              <option value="liquid">Sıvı</option>
              <option value="gas">Gaz</option>
              <option value="powder">Toz</option>
              <option value="crystal">Kristal</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* 🔥 RAW TECHNICAL SPECS SECTION - ADMIN'E GERÇEK VERİ GÖSTER */}
      {formData.rawTechnicalSpecs && formData.rawTechnicalSpecs.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="mr-2">📊</span>
            Orijinal Teknik Özellikler
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">
              {formData.rawTechnicalSpecs.length} özellik
            </span>
          </h3>
          <div className="bg-blue-50/50 rounded-lg p-4">
            <div className="grid md:grid-cols-3 gap-4">
              {formData.rawTechnicalSpecs.map((spec, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    {spec.name}
                    {spec.unit && <span className="text-gray-500 ml-1">({spec.unit})</span>}
                  </div>
                  <div className="text-lg font-semibold text-blue-800">
                    {spec.value}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-blue-600">
              ℹ️ Bu değerler backend'den gelen orijinal teknik özelliklerdir - admin panelinde girilen gerçek data
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
})

TechnicalDetailsSection.displayName = 'TechnicalDetailsSection'

export default TechnicalDetailsSection