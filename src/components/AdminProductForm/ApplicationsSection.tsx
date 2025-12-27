import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ApplicationsSectionProps {
  formData: {
    applications?: string[]
    tags?: string[]
    usageAreas?: string[]
  }
  onInputChange: (field: string, value: any) => void
  loading?: boolean
}

const ApplicationsSection: React.FC<ApplicationsSectionProps> = React.memo(({
  formData,
  onInputChange,
  loading = false
}) => {
  const [newApplication, setNewApplication] = useState('')
  const [newTag, setNewTag] = useState('')

  const addApplication = () => {
    if (newApplication.trim()) {
      const currentApplications = formData.applications || []
      onInputChange('applications', [...currentApplications, newApplication.trim()])
      setNewApplication('')
    }
  }

  const removeApplication = (index: number) => {
    const currentApplications = formData.applications || []
    onInputChange('applications', currentApplications.filter((_, i) => i !== index))
  }

  const addTag = () => {
    if (newTag.trim()) {
      const currentTags = formData.tags || []
      onInputChange('tags', [...currentTags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (index: number) => {
    const currentTags = formData.tags || []
    onInputChange('tags', currentTags.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      action()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-white rounded-lg shadow-md p-6"
    >
      <h2 className="text-xl font-bold text-primary-800 mb-4">Kullanım Alanları</h2>
      
      {/* Applications Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Uygulama Alanları</h3>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newApplication}
            onChange={(e) => setNewApplication(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, addApplication)}
            placeholder="Kullanım alanı ekle..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500 transition-colors"
            disabled={loading}
          />
          <button
            type="button"
            onClick={addApplication}
            disabled={loading || !newApplication.trim()}
            className="px-4 py-2 bg-scientific-blue-500 text-white rounded-lg hover:bg-scientific-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Ekle
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {formData.applications?.map((app, index) => (
              <motion.span
                key={`app-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center px-3 py-1 bg-scientific-blue-100 text-scientific-blue-800 rounded-full text-sm"
              >
                <span>{app}</span>
                <button
                  type="button"
                  onClick={() => removeApplication(index)}
                  disabled={loading}
                  className="ml-2 text-scientific-blue-600 hover:text-scientific-blue-800 disabled:cursor-not-allowed transition-colors"
                >
                  ×
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Tags Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Etiketler</h3>
        
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, addTag)}
            placeholder="Etiket ekle..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500 transition-colors"
            disabled={loading}
          />
          <button
            type="button"
            onClick={addTag}
            disabled={loading || !newTag.trim()}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            Ekle
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {formData.tags?.map((tag, index) => (
              <motion.span
                key={`tag-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  disabled={loading}
                  className="ml-2 text-green-600 hover:text-green-800 disabled:cursor-not-allowed transition-colors"
                >
                  ×
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Suggestions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Önerilenler:</h4>
        <div className="flex flex-wrap gap-2 text-xs">
          {['Laboratuvar', 'Araştırma', 'Endüstriyel', 'Analitik', 'Sentez', 'Kalite Kontrol'].map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                const currentApplications = formData.applications || []
                if (!currentApplications.includes(suggestion)) {
                  onInputChange('applications', [...currentApplications, suggestion])
                }
              }}
              disabled={loading || formData.applications?.includes(suggestion)}
              className="px-2 py-1 bg-white border border-gray-200 rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
})

ApplicationsSection.displayName = 'ApplicationsSection'

export default ApplicationsSection