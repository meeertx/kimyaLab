import React, { useState, useEffect, Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { Product, CertificateUploadForm } from '../../types'
import AdminLayout from '../../components/AdminLayout/AdminLayout'
import { ProductService } from '../../services/productService'
import { getImagePath } from '../../services/optimizedImageService'
import { useSuccessNotification, useErrorNotification, useWarningNotification } from '../../components/NotificationSystem/NotificationSystem'

// Lazy load heavy components for better bundle splitting
const BasicInfoSection = lazy(() => import('../../components/AdminProductForm/BasicInfoSection'))
const TechnicalDetailsSection = lazy(() => import('../../components/AdminProductForm/TechnicalDetailsSection'))
const ApplicationsSection = lazy(() => import('../../components/AdminProductForm/ApplicationsSection'))
const StockPricingSection = lazy(() => import('../../components/AdminProductForm/StockPricingSection'))
const OptimizedImageUploader = lazy(() => import('../../components/OptimizedImageUploader/OptimizedImageUploader'))
const CertificateUpload = lazy(() => import('../../components/CertificateUpload/CertificateUpload'))

// Loading skeleton component
const SectionSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
    <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="grid md:grid-cols-2 gap-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
)

const OptimizedAdminProductForm: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  // Notification hooks
  const showSuccess = useSuccessNotification()
  const showError = useErrorNotification()
  const showWarning = useWarningNotification()

  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(isEdit)
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    productCode: '',
    description: '',
    category: 'chemicals',
    brand: '',
    cas: '',
    formula: '',
    molecularWeight: '',
    purity: '',
    grade: '',
    unit: 'kg',
    price: 1,
    currency: 'TRY',
    stock: true,
    stockQuantity: 1,
    minStockLevel: 10,
    isActive: true,
    featured: false,
    images: [],
    thumbnailImage: '🧪',
    applications: [],
    usageAreas: [],
    tags: [],
    formulation: [],
    packaging: [],
    specifications: {
      appearance: 'Toz',
      color: 'Beyaz',
      state: 'solid',
      solubility: [],
      impurities: []
    },
    searchableFields: {
      alternativeNames: [],
      synonyms: [],
      serialNumber: '',
      modelNumber: '',
      tags: []
    }
  })

  const [certificates, setCertificates] = useState<CertificateUploadForm>({
    sds: { tr: null, en: null, ar: null },
    coa: { tr: null, en: null, ar: null },
    msds: { tr: null, en: null, ar: null }
  })

  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Load existing product data (USE RAW DATA FOR ADMIN EDITING)
  useEffect(() => {
    if (isEdit && id) {
      setInitialLoading(true)
      console.log('🔍 Loading RAW product data for admin editing:', id)
      
      // 🚨 KEY FIX: Use getRawProductById for admin editing to avoid fallback conversions
      ProductService.getRawProductById(id)
        .then((rawProduct) => {
          if (rawProduct) {
            console.log('✅ Raw product data loaded for admin editing:', {
              id: rawProduct.id,
              name: rawProduct.name,
              technicalSpecs: rawProduct.technicalSpecs,
              technicalSpecsLength: Array.isArray(rawProduct.technicalSpecs) ? rawProduct.technicalSpecs.length : 'not array',
              applications: rawProduct.applications,
              applicationsLength: Array.isArray(rawProduct.applications) ? rawProduct.applications.length : 'not array'
            })
            
            // Convert raw backend data to frontend format for editing
            const editFormData = {
              id: rawProduct.id,
              name: rawProduct.name,
              productCode: rawProduct.code,
              description: rawProduct.description || '',
              category: rawProduct.category,
              subcategory: rawProduct.subCategory,
              categoryId: rawProduct.categoryId,
              price: parseFloat(rawProduct.price),
              currency: rawProduct.currency,
              unit: rawProduct.unit,
              stock: rawProduct.stockQuantity > 0,
              stockQuantity: rawProduct.stockQuantity,
              minStockLevel: rawProduct.minStockLevel,
              isActive: rawProduct.isActive,
              featured: false, // Default
              
              // 🎯 PRESERVE ORIGINAL ADMIN DATA: Extract technical data from technicalSpecs (WITHOUT fallbacks!)
              brand: rawProduct.technicalSpecs?.find((spec: any) => spec.name?.toLowerCase().includes('brand') || spec.name?.toLowerCase().includes('marka'))?.value || '',
              formula: rawProduct.technicalSpecs?.find((spec: any) => spec.name?.toLowerCase().includes('formula') || spec.name?.toLowerCase().includes('formül'))?.value || '',
              cas: rawProduct.technicalSpecs?.find((spec: any) => spec.name?.toLowerCase().includes('cas'))?.value || '',
              purity: rawProduct.technicalSpecs?.find((spec: any) => spec.name?.toLowerCase().includes('purity') || spec.name?.toLowerCase().includes('saflık'))?.value || '',
              molecularWeight: rawProduct.technicalSpecs?.find((spec: any) => spec.name?.toLowerCase().includes('molecular weight') || spec.name?.toLowerCase().includes('moleküler'))?.value || '',
              grade: rawProduct.technicalSpecs?.find((spec: any) => spec.name?.toLowerCase().includes('grade') || spec.name?.toLowerCase().includes('kalite'))?.value || '',
              
              // 🔥 RAW TECHNICAL SPECS: Pass all technical specs to form for proper display
              rawTechnicalSpecs: rawProduct.technicalSpecs || [],
              
              // Raw arrays - preserve exact admin input
              applications: rawProduct.applications || [],
              usageAreas: rawProduct.applications || [],
              tags: [...(rawProduct.applications || []), ...(rawProduct.certifications || [])],
              
              // Images - convert string[] to ProductImage[] format for form
              images: rawProduct.images?.map((url: string, index: number) => ({
                id: `img_${index + 1}`,
                url,
                alt: `${rawProduct.name} resmi ${index + 1}`,
                type: index === 0 ? 'main' as const : 'gallery' as const,
                order: index + 1
              })) || [],
              thumbnailImage: rawProduct.images?.[0] || '🧪',
              
              // Default structures for form compatibility
              formulation: [],
              packaging: [],
              specifications: {
                appearance: rawProduct.technicalSpecs?.find((spec: any) => spec.name?.toLowerCase().includes('appearance'))?.value || 'Toz',
                color: rawProduct.technicalSpecs?.find((spec: any) => spec.name?.toLowerCase().includes('color'))?.value || 'Beyaz',
                state: rawProduct.technicalSpecs?.find((spec: any) => spec.name?.toLowerCase().includes('state'))?.value || 'solid',
                solubility: [],
                impurities: []
              },
              searchableFields: {
                alternativeNames: [],
                synonyms: rawProduct.applications || [],
                serialNumber: rawProduct.code,
                modelNumber: rawProduct.code,
                tags: [...(rawProduct.applications || []), ...(rawProduct.certifications || [])]
              }
            }
            
            console.log('🎯 Form data prepared from raw product:', {
              brand: editFormData.brand,
              cas: editFormData.cas,
              formula: editFormData.formula,
              applications: editFormData.applications,
              applicationsLength: editFormData.applications.length
            })
            
            setFormData(editFormData)
            
            // Extract existing image URLs for uploader
            const imageUrls = rawProduct.images || []
            setUploadedImageUrls(imageUrls)
          } else {
            showError('Ürün bulunamadı', 'Bu ürün mevcut değil veya silinmiş olabilir.')
            navigate('/admin/products')
          }
        })
        .catch((error) => {
          console.error('❌ Error loading raw product data:', error)
          showError('Ürün yükleme hatası', 'Ürün bilgileri yüklenirken bir hata oluştu.')
          navigate('/admin/products')
        })
        .finally(() => {
          setInitialLoading(false)
        })
    }
  }, [isEdit, id, navigate])

  // Handle form field changes with validation
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const updated = { ...prev }
        delete updated[field]
        return updated
      })
    }
  }

  // Handle nested field changes
  const handleNestedInputChange = (parentField: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField as keyof Product] as any,
        [field]: value
      }
    }))
  }

  // Handle image upload
  const handleImageUpload = (imageUrls: string[]) => {
    setUploadedImageUrls(imageUrls)
    
    const productImages = imageUrls.map((url, index) => ({
      id: `img_${index + 1}`,
      url,
      alt: `${formData.name || 'Ürün'} resmi ${index + 1}`,
      type: index === 0 ? 'main' as const : 'gallery' as const,
      order: index + 1
    }))
    
    setFormData(prev => ({
      ...prev,
      images: productImages,
      thumbnailImage: productImages[0]?.url || '🧪'
    }))
  }

  // Form validation
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name?.trim()) {
      errors.name = 'Ürün adı zorunludur'
    }

    if (!formData.productCode?.trim()) {
      errors.productCode = 'Ürün kodu zorunludur'
    }

    if (!formData.category) {
      errors.category = 'Kategori seçimi zorunludur'
    }

    if (formData.price === undefined || Number(formData.price) < 0) {
      errors.price = 'Geçerli bir fiyat giriniz'
    }

    if (formData.stockQuantity === undefined || Number(formData.stockQuantity) < 0) {
      errors.stockQuantity = 'Geçerli bir stok miktarı giriniz'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      showError('Form Hataları', 'Lütfen kırmızı ile işaretlenen alanları kontrol edin.')
      return
    }

    setLoading(true)

    try {
      // Find the correct categoryId - use subcategoryId if selected, otherwise find main category ID
      let categoryId: string
      
      if (formData.subcategoryId) {
        // Use subcategory ID directly
        categoryId = formData.subcategoryId
      } else {
        // Find main category ID by slug
        try {
          const categoriesApi = await import('../../services/api/categoriesApi')
          const mainCategories = await categoriesApi.CategoriesApi.getMainCategories()
          const selectedMainCategory = mainCategories.find(cat => cat.slug === formData.category)
          
          if (!selectedMainCategory) {
            throw new Error(`Main category not found for slug: ${formData.category}`)
          }
          
          categoryId = selectedMainCategory.id
        } catch (error) {
          console.error('Error fetching category ID:', error)
          throw new Error('Kategori bilgisi alınamadı')
        }
      }

      console.log('🎯 Product will be saved with categoryId:', categoryId)

      // 🚀 CLEAN IMAGES: Backend valid URL + mock URLs gerekiyor
      const cleanImages = (images: any[]): string[] => {
        return images
          ?.map(img => typeof img === 'string' ? img : img?.url)
          ?.filter(url => url && typeof url === 'string' && (url.startsWith('http') || url.startsWith('/mock-uploads/')))
          || []
      }

      // 🚀 CLEAN PRODUCT CODE: Backend [A-Z0-9-_] format gerekiyor
      const cleanProductCode = (code: string): string => {
        if (!code) return 'PROD-' + Date.now().toString().slice(-6)
        
        return code
          .toUpperCase()
          .replace(/[^A-Z0-9-_]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 50)
      }

      // 🚀 TECHNICAL SPECS ARRAY: Individual fields'leri backend format'ına çevir
      const buildTechnicalSpecs = (): Array<{name: string, unit?: string, value: string}> => {
        const specs: Array<{name: string, unit?: string, value: string}> = []
        
        // Individual technical fields → technicalSpecs array
        if (formData.brand?.trim()) {
          specs.push({ name: 'Brand', value: formData.brand.trim() })
        }
        if (formData.formula?.trim()) {
          specs.push({ name: 'Formula', value: formData.formula.trim() })
        }
        if (formData.cas?.trim()) {
          specs.push({ name: 'CAS Number', value: formData.cas.trim() })
        }
        if (formData.molecularWeight?.trim()) {
          specs.push({ name: 'Molecular Weight', unit: 'g/mol', value: formData.molecularWeight.trim() })
        }
        if (formData.purity?.trim()) {
          specs.push({ name: 'Purity', unit: '%', value: formData.purity.trim() })
        }
        if (formData.grade?.trim()) {
          specs.push({ name: 'Grade', value: formData.grade.trim() })
        }
        
        // Specifications fields → technicalSpecs array
        if (formData.specifications?.appearance?.trim()) {
          specs.push({ name: 'Appearance', value: formData.specifications.appearance.trim() })
        }
        if (formData.specifications?.color?.trim()) {
          specs.push({ name: 'Color', value: formData.specifications.color.trim() })
        }
        if (formData.specifications?.state?.trim()) {
          specs.push({ name: 'Physical State', value: formData.specifications.state.trim() })
        }
        
        return specs
      }

      // Prepare product data
      const productData = {
        ...formData,
        // Ensure required fields
        name: formData.name!,
        productCode: cleanProductCode(formData.productCode!), // ✅ Cleaned product code
        category: formData.category!,
        categoryId: categoryId,
        // Multi-language support
        nameEn: formData.nameEn || formData.name,
        nameAr: formData.nameAr || formData.name,
        descriptionEn: formData.descriptionEn || formData.description,
        descriptionAr: formData.descriptionAr || formData.description,
        // Default values
        price: formData.price || 1,
        currency: formData.currency || 'TRY',
        unit: formData.unit || 'kg',
        stock: formData.stock !== undefined ? formData.stock : true,
        stockQuantity: formData.stockQuantity || 0,
        minStockLevel: formData.minStockLevel || 10,
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        featured: formData.featured || false,
        images: cleanImages(formData.images || []), // ✅ Convert ProductImage[] to string[] for backend
        applications: formData.applications || [],
        tags: formData.tags || [],
        
        // 🔥 CRITICAL FIX: Individual fields → technicalSpecs array
        technicalSpecs: buildTechnicalSpecs(),
        
        specifications: formData.specifications || {
          appearance: '',
          state: 'solid',
          solubility: [],
          impurities: []
        },
        searchableFields: formData.searchableFields || {
          alternativeNames: [],
          synonyms: [],
          serialNumber: '',
          modelNumber: '',
          tags: []
        }
      } as any // Backend UpdateProductData format - images: string[]

      console.log('🚀 Updating product with data:', {
        name: productData.name,
        code: productData.productCode,
        imagesCount: productData.images.length,
        imagesType: typeof productData.images[0],
        currency: productData.currency,
        categoryId: productData.categoryId,
        // 🔥 CRITICAL DEBUG: Technical Specs array
        technicalSpecsCount: productData.technicalSpecs?.length || 0,
        technicalSpecs: productData.technicalSpecs
      })

      // 🔍 ADDITIONAL FORM DATA DEBUG:
      console.log('📊 Form Data Technical Fields:', {
        brand: formData.brand,
        formula: formData.formula,
        cas: formData.cas,
        molecularWeight: formData.molecularWeight,
        purity: formData.purity,
        grade: formData.grade,
        appearance: formData.specifications?.appearance,
        color: formData.specifications?.color,
        state: formData.specifications?.state
      })

      let productId: string

      if (isEdit && id) {
        await ProductService.updateProduct(id, productData)
        productId = id
        showSuccess('Ürün Güncellendi!', `${formData.name} başarıyla güncellendi.`)
      } else {
        productId = await ProductService.addProduct(productData)
        showSuccess('Ürün Kaydedildi! 🎉', `${formData.name} başarıyla eklendi ve frontend'de yayınlandı.`)
      }

      // Handle certificate uploads if any
      const hasCertificates = Object.values(certificates).some(cert => 
        Object.values(cert).some(file => file !== null)
      )

      if (hasCertificates) {
        console.log('Certificates to upload:', certificates)
        // Certificate upload logic would go here
      }

      navigate('/admin/products')
    } catch (error) {
      console.error('Error saving product:', error)
      showError(
        'Ürün Kaydetme Hatası',
        `Ürün ${isEdit ? 'güncellenirken' : 'kaydedilirken'} bir hata oluştu. Lütfen tekrar deneyin.`
      )
    } finally {
      setLoading(false)
    }
  }

  const breadcrumb = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Ürün Yönetimi', href: '/admin/products' },
    { label: isEdit ? 'Ürün Düzenle' : 'Yeni Ürün Ekle' }
  ]

  // Show loading state for initial load
  if (initialLoading) {
    return (
      <AdminLayout title={isEdit ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'} breadcrumb={breadcrumb}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-scientific-blue-300 border-t-scientific-blue-600 mb-4"></div>
            <p className="text-primary-600 font-medium">Ürün bilgileri yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title={isEdit ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'} breadcrumb={breadcrumb}>
      <div className="max-w-4xl mx-auto">
        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-r from-scientific-blue-50 to-green-50 rounded-lg shadow-sm p-4 border border-gray-200 mb-6"
        >
          <p className="text-gray-700">
            ✨ <strong>Optimize edilmiş form:</strong> Paralel resim yükleme, akıllı validasyon ve hızlı kaydetme
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Suspense fallback={<SectionSkeleton />}>
            <BasicInfoSection
              formData={formData}
              onInputChange={handleInputChange}
              loading={loading}
            />
          </Suspense>

          {/* Technical Details */}
          <Suspense fallback={<SectionSkeleton />}>
            <TechnicalDetailsSection
              formData={formData}
              onInputChange={handleInputChange}
              onNestedInputChange={handleNestedInputChange}
              loading={loading}
            />
          </Suspense>

          {/* Applications */}
          <Suspense fallback={<SectionSkeleton />}>
            <ApplicationsSection
              formData={formData}
              onInputChange={handleInputChange}
              loading={loading}
            />
          </Suspense>

          {/* Stock & Pricing */}
          <Suspense fallback={<SectionSkeleton />}>
            <StockPricingSection
              formData={{
                ...formData,
                price: typeof formData.price === 'string' ? Number(formData.price) : formData.price
              }}
              onInputChange={handleInputChange}
              loading={loading}
            />
          </Suspense>

          {/* Image Upload */}
          <Suspense fallback={<SectionSkeleton />}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h2 className="text-xl font-bold text-primary-800 mb-4">Ürün Resimleri</h2>
              <OptimizedImageUploader
                onImagesUploaded={handleImageUpload}
                maxImages={10}
                path={getImagePath(formData.category || 'chemicals', formData.id || 'temp')}
                allowMultiple={true}
                autoUpload={true}
                existingImages={uploadedImageUrls}
                uploadOptions={{
                  resize: true,
                  compress: true,
                  maxWidth: 1920,
                  maxHeight: 1920,
                  quality: 0.85,
                  concurrency: 3
                }}
              />
            </motion.div>
          </Suspense>

          {/* Certificates */}
          <Suspense fallback={<SectionSkeleton />}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20"
            >
              <CertificateUpload
                productId={formData.id || 'new'}
                existingCertificates={certificates}
                onCertificatesChange={setCertificates}
                disabled={loading}
              />
            </motion.div>
          </Suspense>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex justify-end space-x-4 sticky bottom-4 bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200"
          >
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading || Object.keys(validationErrors).length > 0}
              className="px-8 py-3 bg-scientific-blue-500 text-white rounded-lg hover:bg-scientific-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>{isEdit ? 'Güncelle' : 'Kaydet'}</span>
                </>
              )}
            </button>
          </motion.div>

          {/* Validation Errors Summary */}
          {Object.keys(validationErrors).length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-sm"
            >
              <h4 className="text-sm font-medium text-red-800 mb-2">Form Hataları:</h4>
              <ul className="text-xs text-red-600 space-y-1">
                {Object.entries(validationErrors).map(([field, error]) => (
                  <li key={field}>• {error}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </form>
      </div>
    </AdminLayout>
  )
}

export default OptimizedAdminProductForm