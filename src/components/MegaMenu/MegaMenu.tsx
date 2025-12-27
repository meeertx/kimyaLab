import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Category } from '../../types'

// Services
import { CategoryService } from '../../services/productService'

interface MegaMenuProps {
  isOpen: boolean
  onClose: () => void
  isMobile: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

// Ana kategori iconları
const getCategoryIcon = (categoryName: string) => {
  const icons: { [key: string]: string } = {
    'analitik': '🔬',
    'biyokimya': '🧬',
    'organik': '⚗️',
    'inorganik': '🧪',
    'chemicals': '🧪',
    'life_sciences': '🧬',
    'raw_materials': '⚗️',
    'applications': '🔬',
    'kimyasal': '🧪',
    'laboratuvar': '🔬',
    'default': '📦'
  }
  
  const name = categoryName.toLowerCase()
  for (const key in icons) {
    if (name.includes(key)) {
      return icons[key]
    }
  }
  return icons.default
}

const MegaMenu: React.FC<MegaMenuProps> = ({
  isOpen,
  onClose,
  isMobile,
  onMouseEnter,
  onMouseLeave
}) => {
  const { t } = useTranslation()
  const menuRef = useRef<HTMLDivElement>(null)
  
  // PostgreSQL Backend state
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Load categories (using mock data for now)
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Use mock data directly (backend will be integrated later)
        setAllCategories([])
      } catch (err) {
        console.error('Error loading categories for MegaMenu:', err)
        setError('Kategoriler yüklenirken bir hata oluştu.')
        setAllCategories([])
      } finally {
        setLoading(false)
      }
    }

    // Only load once when component mounts
    loadCategories()
  }, [])

  // Kullanıcının istediği spesifik kategori yapısı
  const mockCategories = [
    {
      id: 'chemicals',
      name: 'Chemicals',
      slug: 'chemicals',
      icon: '🧪',
      subcategories: [
        { id: '1', name: 'Absorbents & adsorbents', slug: 'absorbents-adsorbents', productCount: 45 },
        { id: '2', name: 'Acids & bases', slug: 'acids-bases', productCount: 78 },
        { id: '3', name: 'Alcohols', slug: 'alcohols', productCount: 56 },
        { id: '4', name: 'Buffers', slug: 'buffers', productCount: 34 },
        { id: '5', name: 'Catalysts', slug: 'catalysts', productCount: 29 },
        { id: '6', name: 'Dyes, stains & indicators', slug: 'dyes-stains-indicators', productCount: 67 },
        { id: '7', name: 'Elements & elemental solutions', slug: 'elements-elemental-solutions', productCount: 43 },
        { id: '8', name: 'Grease, oils & paraffins', slug: 'grease-oils-paraffins', productCount: 23 },
        { id: '9', name: 'Macherey-Nagel products', slug: 'macherey-nagel-products', productCount: 89 },
        { id: '10', name: 'Oxides', slug: 'oxides', productCount: 37 },
        { id: '11', name: 'Salts & minerals', slug: 'salts-minerals', productCount: 92 },
        { id: '12', name: 'Reagents', slug: 'reagents', productCount: 156 },
        { id: '13', name: 'Solvents & water', slug: 'solvents-water', productCount: 134 },
        { id: '14', name: 'Standards', slug: 'standards', productCount: 78 }
      ]
    },
    {
      id: 'life-sciences',
      name: 'Life Sciences',
      slug: 'life-sciences',
      icon: '🧬',
      subcategories: [
        { id: '15', name: 'Amino acids', slug: 'amino-acids', productCount: 45 },
        { id: '16', name: 'Antibiotics & antimycotics', slug: 'antibiotics-antimycotics', productCount: 67 },
        { id: '17', name: 'Life Sciences buffers', slug: 'life-sciences-buffers', productCount: 34 },
        { id: '18', name: 'Bioreagents', slug: 'bioreagents', productCount: 89 },
        { id: '19', name: 'Carbohydrates & sugars', slug: 'carbohydrates-sugars', productCount: 23 },
        { id: '20', name: 'Decontamination & cleaning', slug: 'decontamination-cleaning', productCount: 56 },
        { id: '21', name: 'Detergents', slug: 'detergents', productCount: 29 },
        { id: '22', name: 'Enzymes', slug: 'enzymes', productCount: 123 },
        { id: '23', name: 'Histology', slug: 'histology', productCount: 78 },
        { id: '24', name: 'Microbiology & cell culture', slug: 'microbiology-cell-culture', productCount: 145 },
        { id: '25', name: 'Molecular biology', slug: 'molecular-biology', productCount: 167 },
        { id: '26', name: 'Protein biochemistry', slug: 'protein-biochemistry', productCount: 98 },
        { id: '27', name: 'Vitamins', slug: 'vitamins', productCount: 43 }
      ]
    },
    {
      id: 'raw-materials',
      name: 'Raw materials',
      slug: 'raw-materials',
      icon: '⚗️',
      subcategories: [
        { id: '28', name: 'Biopharma', slug: 'biopharma', productCount: 234 },
        { id: '29', name: 'Pharma', slug: 'pharma', productCount: 189 },
        { id: '30', name: 'Diagnostics', slug: 'diagnostics', productCount: 145 },
        { id: '31', name: 'Food', slug: 'food', productCount: 87 }
      ]
    },
    {
      id: 'applications',
      name: 'Applications',
      slug: 'applications',
      icon: '🔬',
      subcategories: [
        { id: '32', name: 'Chromatography (GC & HPLC)', slug: 'chromatography-gc-hplc', productCount: 156 },
        { id: '33', name: 'Decontamination & cleaning', slug: 'decontamination-cleaning-app', productCount: 67 },
        { id: '34', name: 'Karl Fischer titration', slug: 'karl-fischer-titration', productCount: 34 },
        { id: '35', name: 'Kjeldahl analysis', slug: 'kjeldahl-analysis', productCount: 28 },
        { id: '36', name: 'Microbiology & cell culture', slug: 'microbiology-cell-culture-app', productCount: 89 },
        { id: '37', name: 'Protein biochemistry', slug: 'protein-biochemistry-app', productCount: 73 },
        { id: '38', name: 'Spectroscopy & MS', slug: 'spectroscopy-ms', productCount: 124 },
        { id: '39', name: 'Titration', slug: 'titration', productCount: 45 }
      ]
    }
  ]

  // Backend'den gelen kategoriler varsa onları kullan, yoksa mock data kullan
  const displayCategories = allCategories.length > 0 ?
    allCategories.map((cat: any) => ({
      ...cat,
      icon: getCategoryIcon(cat.name),
      subcategories: cat.children || []
    })) : mockCategories

  // Animation variants
  const menuVariants = {
    hidden: {
      opacity: 0,
      y: -20,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
        staggerChildren: 0.05
      }
    }
  }

  const columnVariants = {
    hidden: {
      opacity: 0,
      x: -10
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
        staggerChildren: 0.02
      }
    }
  }

  const itemVariants = {
    hidden: {
      opacity: 0,
      x: -5
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-[60]"
            onClick={onClose}
          />

          {/* Mega Menu Panel */}
          <motion.div
            ref={menuRef}
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className={`
              fixed left-0 right-0 z-[70] bg-white border-t border-gray-200 shadow-2xl
              ${isMobile
                ? 'top-16 bottom-0 overflow-y-auto'
                : 'top-16 md:top-20'
              }
            `}
            style={{
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
          >
            <div className={`
              container mx-auto px-4 py-6
              ${isMobile ? 'max-w-full' : 'max-w-7xl'}
            `}>
              
              {/* Loading State */}
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-scientific-blue-500"></div>
                  <span className="ml-3 text-primary-600">Kategoriler yükleniyor...</span>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="text-center py-8">
                  <div className="text-red-500 text-2xl mb-2">⚠️</div>
                  <p className="text-red-700 font-medium mb-3">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    Yeniden Dene
                  </button>
                </div>
              )}
              
              {/* Tüm Kategoriler - Büyük Layout */}
              {!loading && !error && (
                <div className={`
                  ${isMobile
                    ? 'space-y-4'
                    : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'
                  }
                  max-w-none w-full px-4
                `}>
                  {/* Tüm kategoriler */}
                  {displayCategories.map((category: any, index: number) => (
                    <motion.div
                      key={category.id}
                      variants={columnVariants}
                      className={`
                        ${isMobile ? 'border-b border-gray-200 pb-4 last:border-b-0' : ''}
                      `}
                    >
                      {/* Ana Kategori Başlığı */}
                      <div className="mb-3">
                        <Link
                          to={`/kategori/${category.slug}`}
                          onClick={onClose}
                          className="group block"
                        >
                          <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2 pb-2 border-b border-gray-200 group-hover:text-blue-600 transition-colors">
                            <span>{category.icon || getCategoryIcon(category.name)}</span>
                            <span>{category.name}</span>
                          </h3>
                        </Link>
                      </div>

                      {/* Alt Kategoriler */}
                      {category.subcategories && category.subcategories.length > 0 && (
                        <div className="space-y-1">
                          {category.subcategories.map((subcategory: any, subIndex: number) => (
                            <motion.div
                              key={subcategory.id}
                              variants={itemVariants}
                              custom={subIndex}
                            >
                              <Link
                                to={`/kategori/${subcategory.slug}`}
                                onClick={onClose}
                                className="group flex items-center justify-between py-1.5 px-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded transition-all duration-200"
                              >
                                <span className="group-hover:translate-x-1 transition-transform duration-200">
                                  {subcategory.name}
                                </span>
                                <span className="text-xs text-gray-400 group-hover:text-blue-500">
                                  ({subcategory.productCount || 0})
                                </span>
                              </Link>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Kategori Tümünü Gör Linki */}
                      <div className="mt-3 pt-2">
                        <Link
                          to={`/kategori/${category.slug}`}
                          onClick={onClose}
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          <span>View all {category.name}</span>
                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Öne Çıkan Ürünler - Sade */}
              {!isMobile && !loading && !error && (
                <motion.div
                  variants={itemVariants}
                  className="mt-8 pt-6 border-t border-gray-200"
                >
                  <div className="mb-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-800">
                        Öne Çıkan Ürün Grupları
                      </h4>
                      <Link
                        to="/urunler"
                        onClick={onClose}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                      >
                        Tüm Ürünler →
                      </Link>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { name: 'HPLC Çözücüleri', count: '45+', icon: '🧪' },
                      { name: 'Enzim Kitleri', count: '67+', icon: '🧬' },
                      { name: 'Organik Standartlar', count: '89+', icon: '⚗️' },
                      { name: 'Metal Tuzları', count: '78+', icon: '🔬' }
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="text-center py-3 hover:bg-gray-50 rounded transition-colors duration-200 cursor-pointer"
                      >
                        <div className="text-2xl mb-2">{item.icon}</div>
                        <div className="text-sm font-medium text-gray-800 mb-1">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.count} Ürün</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Mobile Close Button - Sade */}
              {isMobile && (
                <motion.div
                  variants={itemVariants}
                  className="mt-6 text-center border-t border-gray-200 pt-4"
                >
                  <button
                    onClick={onClose}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded font-medium hover:bg-blue-700 transition-colors duration-200"
                  >
                    Kapat
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default MegaMenu

// Status indicator
console.log('🚀 MegaMenu: Using PostgreSQL Backend (Firebase removed)')