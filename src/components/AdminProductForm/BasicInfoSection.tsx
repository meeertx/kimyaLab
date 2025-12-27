import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { CategoriesApi, BackendCategory } from '../../services/api/categoriesApi'

interface BasicInfoSectionProps {
  formData: {
    name?: string
    productCode?: string
    category?: string
    subcategoryId?: string
    brand?: string
    cas?: string
    formula?: string
    description?: string
  }
  onInputChange: (field: string, value: any) => void
  loading?: boolean
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = React.memo(({
  formData,
  onInputChange,
  loading = false
}) => {
  const { t } = useTranslation()
  const [mainCategories, setMainCategories] = useState<BackendCategory[]>([])
  const [subcategories, setSubcategories] = useState<BackendCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingSubcategories, setLoadingSubcategories] = useState(false)

  // Kategori çeviri helper'ı - kullanıcının istediği kategoriler
  const categoryMapping: { [key: string]: string } = {
    'chemicals': 'Chemicals',
    'life-sciences': 'Life Sciences',
    'raw-materials': 'Raw materials',
    'applications': 'Applications',
    // Alt kategoriler
    'absorbents-adsorbents': 'Absorbents & adsorbents',
    'acids-bases': 'Acids & bases',
    'alcohols': 'Alcohols',
    'buffers': 'Buffers',
    'catalysts': 'Catalysts',
    'dyes-stains-indicators': 'Dyes, stains & indicators',
    'elements-elemental-solutions': 'Elements & elemental solutions',
    'grease-oils-paraffins': 'Grease, oils & paraffins',
    'macherey-nagel-products': 'Macherey-Nagel products',
    'oxides': 'Oxides',
    'salts-minerals': 'Salts & minerals',
    'reagents': 'Reagents',
    'solvents-water': 'Solvents & water',
    'standards': 'Standards',
    'amino-acids': 'Amino acids',
    'antibiotics-antimycotics': 'Antibiotics & antimycotics',
    'life-sciences-buffers': 'Life Sciences buffers',
    'bioreagents': 'Bioreagents',
    'carbohydrates-sugars': 'Carbohydrates & sugars',
    'decontamination-cleaning': 'Decontamination & cleaning',
    'detergents': 'Detergents',
    'enzymes': 'Enzymes',
    'histology': 'Histology',
    'microbiology-cell-culture': 'Microbiology & Cell Culture',
    'molecular-biology': 'Molecular biology',
    'protein-biochemistry': 'Protein biochemistry',
    'vitamins': 'Vitamins',
    'biopharma': 'Biopharma',
    'pharma': 'Pharma',
    'diagnostics': 'Diagnostics',
    'food': 'Food',
    'chromatography-gc-hplc': 'Chromatography (GC & HPLC)',
    'decontamination-cleaning-app': 'Decontamination & cleaning',
    'karl-fischer-titration': 'Karl Fischer titration',
    'kjeldahl-analysis': 'Kjeldahl analysis',
    'microbiology-cell-culture-app': 'Microbiology & Cell Culture',
    'protein-biochemistry-app': 'Protein biochemistry',
    'spectroscopy-ms': 'Spectroscopy & MS',
    'titration': 'Titration'
  }

  const getCategoryTranslation = (categorySlug: string) => {
    return categoryMapping[categorySlug] || categorySlug
  }

  // Reverse lookup: category name to slug
  const getCategorySlug = (categoryName: string) => {
    // Case-insensitive search
    const entries = Object.entries(categoryMapping)
    const found = entries.find(([slug, name]) =>
      name.toLowerCase() === categoryName.toLowerCase()
    )
    return found ? found[0] : null
  }

  // Load main categories on component mount
  useEffect(() => {
    const loadMainCategories = async () => {
      setLoadingCategories(true)
      try {
        const categories = await CategoriesApi.getMainCategories()
        setMainCategories(categories)
      } catch (error) {
        console.error('Error loading main categories:', error)
      } finally {
        setLoadingCategories(false)
      }
    }

    loadMainCategories()
  }, [])

  // Load subcategories when main category changes
  useEffect(() => {
    const loadSubcategories = async () => {
      if (!formData.category) {
        setSubcategories([])
        return
      }

      setLoadingSubcategories(true)
      try {
        // Convert category name to slug if needed (for editing existing products)
        let categoryIdentifier = formData.category
        
        // If category contains spaces or capital letters, it's probably a name, convert to slug
        if (categoryIdentifier.includes(' ') || /[A-Z]/.test(categoryIdentifier)) {
          // First try direct mapping lookup
          const directSlug = getCategorySlug(categoryIdentifier)
          
          if (directSlug) {
            categoryIdentifier = directSlug
            // Update form data with the correct slug
            onInputChange('category', directSlug)
            console.log(`✅ Found direct slug mapping: ${categoryIdentifier} -> ${directSlug}`)
          } else {
            // Fallback: Find the matching slug from mainCategories (case-insensitive)
            const matchingCategory = mainCategories.find(cat =>
              getCategoryTranslation(cat.slug).toLowerCase() === categoryIdentifier.toLowerCase()
            )
            
            if (matchingCategory) {
              categoryIdentifier = matchingCategory.slug
              // Update form data with the correct slug
              onInputChange('category', matchingCategory.slug)
              console.log(`✅ Found category mapping: ${formData.category} -> ${matchingCategory.slug}`)
            } else {
              console.warn(`Cannot find slug for category name: ${categoryIdentifier}`)
            }
          }
        }
        
        console.log(`🔧 Using category identifier: ${categoryIdentifier} (original: ${formData.category})`)
        
        const subs = await CategoriesApi.getSubcategoriesByParentId(categoryIdentifier)
        setSubcategories(subs)
        
        console.log(`📂 Loaded ${subs.length} subcategories for category: ${categoryIdentifier}`)
        
        // Clear subcategory selection if it doesn't exist in new subcategories
        if (formData.subcategoryId && !subs.find(sub => sub.id === formData.subcategoryId)) {
          onInputChange('subcategoryId', '')
        }
      } catch (error) {
        console.error('Error loading subcategories:', error)
        setSubcategories([])
      } finally {
        setLoadingSubcategories(false)
      }
    }

    loadSubcategories()
  }, [formData.category, mainCategories])

  const handleCategoryChange = (categorySlug: string) => {
    onInputChange('category', categorySlug)
    // Clear subcategory when main category changes
    if (formData.subcategoryId) {
      onInputChange('subcategoryId', '')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="bg-white rounded-lg shadow-md p-6"
    >
      <h2 className="text-xl font-bold text-primary-800 mb-4">Temel Bilgiler</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ürün Adı *
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => onInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500 transition-colors"
            required
            disabled={loading}
            placeholder="Örn: Sodyum Klorür"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ürün Kodu *
          </label>
          <input
            type="text"
            value={formData.productCode || ''}
            onChange={(e) => onInputChange('productCode', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500 transition-colors"
            required
            disabled={loading}
            placeholder="Örn: KIM-001"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ana Kategori *
          </label>
          <select
            value={formData.category || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500 transition-colors disabled:opacity-50"
            required
            disabled={loading || loadingCategories}
          >
            <option value="">
              {loadingCategories ? 'Kategoriler yükleniyor...' : 'Ana Kategori Seçin'}
            </option>
            {mainCategories.map((category) => (
              <option key={category.id} value={category.slug}>
                {getCategoryTranslation(category.slug)}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory Selection - Only show if main category is selected */}
        {formData.category && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alt Kategori
              {subcategories.length > 0 && (
                <span className="text-xs text-green-600 ml-1">
                  ({subcategories.length} alt kategori)
                </span>
              )}
            </label>
            <select
              value={formData.subcategoryId || ''}
              onChange={(e) => onInputChange('subcategoryId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500 transition-colors disabled:opacity-50"
              disabled={loading || loadingSubcategories || subcategories.length === 0}
            >
              <option value="">
                {loadingSubcategories 
                  ? 'Alt kategoriler yükleniyor...' 
                  : subcategories.length === 0 
                    ? 'Bu kategoride alt kategori yok'
                    : 'Alt Kategori Seçin (İsteğe bağlı)'
                }
              </option>
              {subcategories.map((subcategory) => (
                <option key={subcategory.id} value={subcategory.id}>
                  {getCategoryTranslation(subcategory.slug)}
                </option>
              ))}
            </select>
            {loadingSubcategories && (
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-scientific-blue-600 mr-2"></div>
                Alt kategoriler yükleniyor...
              </div>
            )}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Marka
          </label>
          <input
            type="text"
            value={formData.brand || ''}
            onChange={(e) => onInputChange('brand', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500 transition-colors"
            disabled={loading}
            placeholder="Örn: Merck"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CAS Numarası
          </label>
          <input
            type="text"
            value={formData.cas || ''}
            onChange={(e) => onInputChange('cas', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500 transition-colors"
            disabled={loading}
            placeholder="Örn: 7647-14-5"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Moleküler Formül
          </label>
          <input
            type="text"
            value={formData.formula || ''}
            onChange={(e) => onInputChange('formula', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500 transition-colors"
            disabled={loading}
            placeholder="Örn: NaCl"
          />
        </div>
      </div>
      
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Açıklama
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => onInputChange('description', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500 transition-colors resize-vertical"
          disabled={loading}
          placeholder="Ürün hakkında detaylı açıklama..."
        />
      </div>
    </motion.div>
  )
})

BasicInfoSection.displayName = 'BasicInfoSection'

export default BasicInfoSection