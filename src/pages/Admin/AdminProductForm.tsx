import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { Product, ProductImage, FormulationComponent, PackagingOption, CertificateUploadForm } from '../../types'
import AdminLayout from '../../components/AdminLayout/AdminLayout'
import CertificateUpload from '../../components/CertificateUpload/CertificateUpload'
import OptimizedImageUploader from '../../components/OptimizedImageUploader/OptimizedImageUploader'
import { useSuccessNotification, useErrorNotification } from '../../components/NotificationSystem/NotificationSystem'
import { ProductsApi, BackendProduct } from '../../services/api/productsApi'
import { CategoriesApi, BackendCategory } from '../../services/api/categoriesApi'
import { getImagePath } from '../../services/optimizedImageService'
import websocketService from '../../services/websocketService'

const AdminProductForm: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<BackendCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [subcategories, setSubcategories] = useState<BackendCategory[]>([])
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('')
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [loadingSubcategories, setLoadingSubcategories] = useState(false)
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    productCode: '',
    description: '',
    category: 'chemicals' as any, // Default to chemicals
    subcategory: '',
    brand: '',
    cas: '',
    formula: '',
    molecularWeight: '',
    purity: '',
    grade: '',
    price: 0,
    currency: '₺',
    stock: true,
    stockQuantity: 0,
    minStockLevel: 10,
    isActive: true,
    featured: false,
    images: [{ id: '1', url: '🧪', alt: 'Default', type: 'main', order: 1 }],
    thumbnailImage: '🧪',
    applications: [],
    usageAreas: [],
    tags: [],
    formulation: [],
    packaging: [],
    storageConditions: {
      temperature: {
        description: 'Oda sıcaklığında',
        min: 15,
        max: 25,
        unit: 'C'
      },
      lightConditions: 'dark',
      humidity: {
        max: 60,
        description: 'Düşük nem'
      },
      shelfLife: {
        duration: 24,
        unit: 'months',
        conditions: 'Uygun saklama koşullarında'
      },
      specialRequirements: [],
      incompatibleWith: []
    },
    specifications: {
      appearance: 'Toz',
      color: 'Beyaz',
      state: 'solid',
      solubility: [],
      impurities: []
    },
    documents: [],
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

  const [newApplication, setNewApplication] = useState('')
  const [newTag, setNewTag] = useState('')
  const [newFormulation, setNewFormulation] = useState<Partial<FormulationComponent>>({
    component: '',
    amount: '0',
    unit: 'g',
    percentage: 0
  })
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])

  // Notification hooks
  const showSuccessNotification = useSuccessNotification()
  const showErrorNotification = useErrorNotification()

  // WebSocket connection and real-time notifications
  useEffect(() => {
    // Initialize WebSocket connection
    const initializeWebSocket = async () => {
      try {
        const token = localStorage.getItem('authToken') || undefined
        await websocketService.connect(token)
        
        if (websocketService.connected) {
          console.log('🔌 WebSocket connected for AdminProductForm')
        }
      } catch (error) {
        console.warn('🔌 WebSocket connection failed:', error)
      }
    }

    // Set up real-time product update listeners
    const setupRealtimeListeners = () => {
      // Listen for product created events
      const unsubscribeCreated = websocketService.subscribe('productCreated', (data: any) => {
        console.log('📦 Real-time product created:', data)
        showSuccessNotification(
          'Ürün Eklendi! 🎉',
          `${data.product?.name} ürünü real-time olarak tüm kullanıcılara yansıtıldı.`,
          3000
        )
      })

      // Listen for product updated events
      const unsubscribeUpdated = websocketService.subscribe('productUpdated', (data: any) => {
        console.log('📦 Real-time product updated:', data)
        showSuccessNotification(
          'Ürün Güncellendi! ✨',
          `${data.product?.name} ürünü real-time olarak tüm kullanıcılara yansıtıldı.`,
          3000
        )
      })

      // Listen for stock warnings
      const unsubscribeLowStock = websocketService.subscribe('lowStockWarning', (data: any) => {
        console.log('⚠️ Real-time low stock warning:', data)
        showErrorNotification(
          'Düşük Stok Uyarısı! ⚠️',
          data.message,
          {
            label: 'Stok Güncelle',
            handler: () => navigate(`/admin/products/${data.product?.id}/edit`)
          }
        )
      })

      return () => {
        unsubscribeCreated()
        unsubscribeUpdated()
        unsubscribeLowStock()
      }
    }

    // Initialize WebSocket and setup listeners
    initializeWebSocket()
    const cleanup = setupRealtimeListeners()

    // Cleanup on unmount
    return cleanup
  }, [showSuccessNotification, showErrorNotification, navigate])

  // Load main categories from API (optimized)
  const loadCategories = async () => {
    setLoadingCategories(true)
    try {
      const data = await CategoriesApi.getMainCategories(true)
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  // Load subcategories based on selected category (dynamic loading)
  const loadSubcategories = async (parentCategoryId: string) => {
    setLoadingSubcategories(true)
    setSubcategories([])
    setSelectedSubcategory('')
    
    try {
      const subs = await CategoriesApi.getSubcategoriesByParentId(parentCategoryId, true)
      setSubcategories(subs)
    } catch (error) {
      console.error('Error loading subcategories:', error)
      setSubcategories([])
    } finally {
      setLoadingSubcategories(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      loadSubcategories(selectedCategory)
    } else {
      setSubcategories([])
      setSelectedSubcategory('')
    }
  }, [selectedCategory])

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true)
      // Load product data from PostgreSQL API
      ProductsApi.getProductById(id).then((backendProduct) => {
        if (backendProduct) {
          // Convert backend product to frontend format
          const frontendProduct = ProductsApi.convertToFrontendProduct(backendProduct)
          setFormData(frontendProduct)
          
          // Set category selections
          if (backendProduct.categoryId) {
            setSelectedCategory(backendProduct.categoryId)
          }
        } else {
          console.error('Product not found')
          navigate('/admin/products')
        }
        setLoading(false)
      }).catch((error) => {
        console.error('Error loading product:', error)
        setLoading(false)
      })
    }
  }, [isEdit, id, navigate])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedInputChange = (parentField: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField as keyof Product] as any,
        [field]: value
      }
    }))
  }

  const addApplication = () => {
    if (newApplication.trim()) {
      setFormData(prev => ({
        ...prev,
        applications: [...(prev.applications || []), newApplication.trim()]
      }))
      setNewApplication('')
    }
  }

  const removeApplication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      applications: prev.applications?.filter((_, i) => i !== index)
    }))
  }

  const addTag = () => {
    if (newTag.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter((_, i) => i !== index)
    }))
  }

  const addFormulation = () => {
    if (newFormulation.component) {
      const component: FormulationComponent = {
        id: Date.now().toString(),
        component: newFormulation.component!,
        amount: newFormulation.amount || '0',
        unit: newFormulation.unit || 'g',
        percentage: newFormulation.percentage,
        casNumber: newFormulation.casNumber,
        function: newFormulation.function
      }
      
      setFormData(prev => ({
        ...prev,
        formulation: [...(prev.formulation || []), component]
      }))
      
      setNewFormulation({
        component: '',
        amount: '0',
        unit: 'g',
        percentage: 0
      })
    }
  }

  const removeFormulation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      formulation: prev.formulation?.filter((_, i) => i !== index)
    }))
  }

  const handleImageUpload = (imageUrls: string[]) => {
    setUploadedImageUrls(imageUrls)
    // Convert URLs to ProductImage format
    const productImages: ProductImage[] = imageUrls.map((url, index) => ({
      id: `img_${index + 1}`,
      url,
      alt: `${formData.name || 'Ürün'} resmi ${index + 1}`,
      type: index === 0 ? 'main' : 'gallery',
      order: index + 1
    }))
    
    setFormData(prev => ({
      ...prev,
      images: productImages,
      thumbnailImage: productImages[0]?.url || '🧪'
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Define variables outside try/catch for debugging access
    let currentFormData: any = {}
    let productData: any = {}

    try {
      // 🚀 FORMDATA API ULTIMATE FIX: En güvenilir form değeri okuma yöntemi
      const form = e.target as HTMLFormElement
      
      // FormData API ile native form verilerini oku (React state bypass)
      const nativeFormData = new FormData(form)
      
      currentFormData = {
        name: (nativeFormData.get('name') as string)?.trim() || formData.name || '',
        productCode: (nativeFormData.get('productCode') as string)?.trim() || formData.productCode || '',
        cas: (nativeFormData.get('cas') as string)?.trim() || formData.cas || '',
        formula: (nativeFormData.get('formula') as string)?.trim() || formData.formula || '',
        molecularWeight: (nativeFormData.get('molecularWeight') as string)?.trim() || formData.molecularWeight || '',
        purity: (nativeFormData.get('purity') as string)?.trim() || formData.purity || '',
        grade: (nativeFormData.get('grade') as string)?.trim() || formData.grade || ''
      }

      // 🔍 ULTIMATE DEBUG: FormData API ile okunan değerleri kontrol et
      console.log('🚀 FORMDATA API - Native form values:', currentFormData)
      console.log('🔍 Raw FormData entries:', {
        name: nativeFormData.get('name'),
        productCode: nativeFormData.get('productCode'),
        cas: nativeFormData.get('cas'),
        formula: nativeFormData.get('formula'),
        molecularWeight: nativeFormData.get('molecularWeight'),
        purity: nativeFormData.get('purity'),
        grade: nativeFormData.get('grade')
      })
      console.log('🔍 React state fallback values:', {
        name: formData.name,
        productCode: formData.productCode,
        cas: formData.cas,
        formula: formData.formula,
        molecularWeight: formData.molecularWeight,
        purity: formData.purity,
        grade: formData.grade
      })

      // Validate required fields
      if (!currentFormData.name || !currentFormData.productCode) {
        alert('Lütfen ürün adı ve ürün kodunu giriniz.')
        setLoading(false)
        return
      }

      if (!selectedCategory) {
        alert('Lütfen bir kategori seçiniz.')
        setLoading(false)
        return
      }

      // 🔧 ENHANCED FIX: Technical specs'i DOM değerleriyle hazırla
      const technicalSpecs = []
      if (currentFormData.cas) technicalSpecs.push({ name: 'CAS Numarası', value: currentFormData.cas })
      if (currentFormData.formula) technicalSpecs.push({ name: 'Moleküler Formül', value: currentFormData.formula })
      if (currentFormData.molecularWeight) technicalSpecs.push({ name: 'Moleküler Ağırlık', value: currentFormData.molecularWeight })
      if (currentFormData.purity) technicalSpecs.push({ name: 'Saflık', value: currentFormData.purity })
      if (currentFormData.grade) technicalSpecs.push({ name: 'Kalite Derecesi', value: currentFormData.grade })

      // 🔍 DEBUG: DOM'dan hazırlanan technical specs
      console.log('🔍 Technical specs from DOM:', technicalSpecs)

      // 🔧 DATA TYPE FIX: Backend validation kurallarına uygun format
      
      // 🚀 PRODUCT CODE FIX: Backend [A-Z0-9-_] format gerekiyor
      const cleanProductCode = (code: string): string => {
        if (!code) return 'PROD-' + Date.now().toString().slice(-6) // Default code
        
        return code
          .toUpperCase() // Büyük harfe çevir
          .replace(/[^A-Z0-9-_]/g, '-') // Geçersiz karakterleri tire ile değiştir
          .replace(/-+/g, '-') // Birden fazla tireleri tek tire yap
          .replace(/^-|-$/g, '') // Başındaki ve sonundaki tireleri kaldır
          .slice(0, 50) // Max 50 karakter
      }
      
      // 🚀 IMAGES FIX: Backend valid URL gerekiyor, emoji ve boş string'leri filtrele
      const cleanImages = (images: any[]): string[] => {
        return images
          ?.map(img => typeof img === 'string' ? img : img?.url)
          ?.filter(url => url && typeof url === 'string' && url.startsWith('http'))
          || []
      }

      productData = {
        name: currentFormData.name,
        code: cleanProductCode(currentFormData.productCode), // ✅ Temizlenmiş product code
        description: formData.description || null,
        category: formData.category || 'chemicals',
        subCategory: selectedSubcategory || null,
        price: (formData.price?.toString() || '0'), // Backend string bekliyor
        currency: formData.currency === '₺' ? 'TRY' : formData.currency === '$' ? 'USD' : formData.currency === '€' ? 'EUR' : 'TRY',
        stockQuantity: parseInt(formData.stockQuantity?.toString() || '0'),
        minStockLevel: parseInt(formData.minStockLevel?.toString() || '10'),
        unit: 'kg',
        images: cleanImages(formData.images || []), // ✅ Temizlenmiş images array
        technicalSpecs, // ← Güncel technical specs
        applications: formData.applications || [],
        certifications: formData.tags || [],
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        categoryId: selectedSubcategory || selectedCategory
      }

      // 🔧 ID FIX: Update işleminde backend ID'yi data'da istemez, URL'den alır
      // Ama bazı validation'lar ID bekliyor olabilir, kontrol edelim
      if (isEdit && id) {
        // Update için ID gerekli değil çünkü URL'de var: PUT /products/:id
        console.log('📝 Update mode: ID will be taken from URL params')
      } else {
        console.log('➕ Create mode: Backend will generate new ID')
      }

      // 🔍 DEBUG: Backend'e gönderilecek veriyi kontrol et
      console.log('🚀 Sending product data to backend:', productData)

      let result: BackendProduct
      
      if (isEdit && id) {
        // Update existing product
        result = await ProductsApi.updateProduct(id, productData)
        console.log('Product updated successfully:', result)
        
        // Show immediate success notification
        showSuccessNotification(
          'Ürün Başarıyla Güncellendi! ✨',
          `${result.name} ürünü güncellendi. Real-time güncellemeler gönderiliyor...`,
          3000
        )

        // WebSocket will automatically send real-time notifications to all connected users
        console.log('📡 Real-time notifications will be sent via WebSocket')
      } else {
        // Create new product
        result = await ProductsApi.createProduct(productData)
        console.log('Product created successfully:', result)
        
        // Show immediate success notification
        showSuccessNotification(
          'Ürün Başarıyla Kaydedildi! 🎉',
          `${result.name} ürünü sisteme eklendi. Real-time güncellemeler gönderiliyor...`,
          4000
        )

        // WebSocket will automatically send real-time notifications to all connected users
        // This is handled by the backend ProductService
        console.log('📡 Real-time notifications will be sent via WebSocket')
      }
      
      // TODO: Handle certificate uploads here if any certificates were uploaded
      if (certificates.sds.tr || certificates.sds.en || certificates.sds.ar ||
          certificates.coa.tr || certificates.coa.en || certificates.coa.ar ||
          certificates.msds.tr || certificates.msds.en || certificates.msds.ar) {
        console.log('Certificates to upload:', certificates)
        // Certificate upload logic would go here
      }
      
      // Navigate back to products list after a short delay to show notification
      setTimeout(() => {
        navigate('/admin/products')
      }, 1500)
    } catch (error: any) {
      console.error('❌ Error saving product:', error)
      console.error('❌ Full error response:', error?.response)
      console.error('❌ Error data:', error?.response?.data)
      
      // Enhanced error handling for different error types
      let errorTitle = `Ürün ${isEdit ? 'Güncelleme' : 'Kaydetme'} Hatası`
      let errorMessage = `Ürün ${isEdit ? 'güncellenirken' : 'kaydedilirken'} bir hata oluştu. Lütfen tekrar deneyin.`
      
      // JWT Token expired error
      if (error?.response?.status === 401) {
        errorTitle = 'Oturum Süresi Doldu!'
        errorMessage = 'Lütfen tekrar giriş yapın.'
        showErrorNotification(errorTitle, errorMessage, {
          label: 'Giriş Yap',
          handler: () => {
            localStorage.removeItem('authToken')
            navigate('/admin/auth')
          }
        })
        return
      }
      
      // Validation error (400) - Enhanced with field details
      if (error?.response?.status === 400) {
        errorTitle = 'Doğrulama Hatası - Eksik Alanlar!'
        
        // Backend validation error message parsing
        const backendMessage = error?.response?.data?.message || ''
        const backendError = error?.response?.data?.error || ''
        
        console.log('🔍 Backend validation error:', {
          status: error?.response?.status,
          message: backendMessage,
          error: backendError,
          data: error?.response?.data
        })
        
        // Try to parse specific validation errors
        if (backendMessage.includes('code')) {
          errorMessage = '❌ Ürün Kodu gerekli ve büyük harf olmalıdır (örn: PROD-001)'
        } else if (backendMessage.includes('name')) {
          errorMessage = '❌ Ürün Adı gerekli (2-200 karakter)'
        } else if (backendMessage.includes('price')) {
          errorMessage = '❌ Fiyat gerekli ve 0\'dan büyük olmalıdır'
        } else if (backendMessage.includes('currency')) {
          errorMessage = '❌ Para birimi TRY, USD veya EUR olmalıdır'
        } else if (backendMessage.includes('category')) {
          errorMessage = '❌ Kategori seçimi gerekli'
        } else if (backendMessage.includes('stockQuantity')) {
          errorMessage = '❌ Stok miktarı sayısal değer olmalıdır'
        } else if (backendMessage.includes('unit')) {
          errorMessage = '❌ Birim (unit) alanı gerekli'
        } else {
          // Generic validation message with backend details
          errorMessage = `❌ Form validation hatası:\n${backendMessage || backendError}`
        }
      }
      
      // Network error
      if (!error?.response) {
        errorTitle = 'Bağlantı Hatası!'
        errorMessage = 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.'
      }
      
      // Show error notification with longer duration for validation errors
      showErrorNotification(errorTitle, errorMessage, {
        label: 'Tekrar Dene',
        handler: () => handleSubmit(new Event('submit') as any)
      })
      
      // Additional debugging for validation errors
      if (error?.response?.status === 400) {
        console.log('🔍 DEBUGGING: Current productData that failed validation:', productData)
        console.log('🔍 DEBUGGING: FormData values:', currentFormData)
        console.log('🔍 DEBUGGING: Selected category/subcategory:', { selectedCategory, selectedSubcategory })
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle category change (optimized with dynamic loading)
  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategory(categoryId)
    setSelectedSubcategory('')
    
    // Find category name and set it in form data
    const category = categories.find(cat => cat.id === categoryId)
    if (category) {
      setFormData(prev => ({
        ...prev,
        category: category.slug as any
      }))
      
      // Load subcategories dynamically
      await loadSubcategories(categoryId)
    }
  }

  // Handle subcategory change
  const handleSubcategoryChange = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId)
    
    // Find subcategory name and set it in form data
    const subcategory = subcategories.find(cat => cat.id === subcategoryId)
    if (subcategory) {
      setFormData(prev => ({
        ...prev,
        subcategory: subcategory.name
      }))
    }
  }

  const breadcrumb = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Ürün Yönetimi', href: '/admin/products' },
    { label: isEdit ? 'Ürün Düzenle' : 'Yeni Ürün Ekle' }
  ]

  if (loading && isEdit) {
    return (
      <AdminLayout
        title={isEdit ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
        breadcrumb={breadcrumb}
      >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-scientific-blue-300 border-t-scientific-blue-600 mb-4"></div>
            <p className="text-primary-600 font-medium">Ürün yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title={isEdit ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
      breadcrumb={breadcrumb}
    >
      <div className="max-w-4xl mx-auto">
        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-6"
        >
          <p className="text-gray-600">
            Ürün bilgilerini detaylı olarak girin
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
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
                  name="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ürün Kodu *
                </label>
                <input
                  type="text"
                  name="productCode"
                  value={formData.productCode}
                  onChange={(e) => handleInputChange('productCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ana Kategori *
                  {loadingCategories && <span className="text-scientific-blue-500 text-xs ml-2">Yükleniyor...</span>}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                  disabled={loadingCategories}
                  required
                >
                  <option value="">
                    {loadingCategories ? 'Kategoriler yükleniyor...' : 'Kategori Seçiniz'}
                  </option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCategory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alt Kategori
                    {loadingSubcategories && <span className="text-scientific-blue-500 text-xs ml-2">Alt kategoriler yükleniyor...</span>}
                  </label>
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => handleSubcategoryChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                    disabled={loadingSubcategories}
                  >
                    <option value="">
                      {loadingSubcategories
                        ? 'Alt kategoriler yükleniyor...'
                        : subcategories.length === 0
                          ? 'Bu kategori için alt kategori bulunmuyor'
                          : 'Alt kategori seçiniz'
                      }
                    </option>
                    {subcategories.map(subcategory => (
                      <option key={subcategory.id} value={subcategory.id}>
                        {subcategory.name}
                      </option>
                    ))}
                  </select>
                  {!loadingSubcategories && subcategories.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Bu ana kategori için henüz alt kategori tanımlanmamış
                    </p>
                  )}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marka
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CAS Numarası
                </label>
                <input
                  type="text"
                  name="cas"
                  value={formData.cas}
                  onChange={(e) => handleInputChange('cas', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moleküler Formül
                </label>
                <input
                  type="text"
                  name="formula"
                  value={formData.formula}
                  onChange={(e) => handleInputChange('formula', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Açıklama
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
              />
            </div>
          </motion.div>

          {/* Technical Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-bold text-primary-800 mb-4">Teknik Detaylar</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moleküler Ağırlık
                </label>
                <input
                  type="text"
                  name="molecularWeight"
                  value={formData.molecularWeight}
                  onChange={(e) => handleInputChange('molecularWeight', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saflık
                </label>
                <input
                  type="text"
                  name="purity"
                  value={formData.purity}
                  onChange={(e) => handleInputChange('purity', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kalite Derecesi
                </label>
                <input
                  type="text"
                  name="grade"
                  value={formData.grade}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                />
              </div>
            </div>
          </motion.div>

          {/* Applications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-bold text-primary-800 mb-4">Kullanım Alanları</h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newApplication}
                onChange={(e) => setNewApplication(e.target.value)}
                placeholder="Kullanım alanı ekle..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
              />
              <button
                type="button"
                onClick={addApplication}
                className="px-4 py-2 bg-scientific-blue-500 text-white rounded-lg hover:bg-scientific-blue-600"
              >
                Ekle
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {formData.applications?.map((app, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-scientific-blue-100 text-scientific-blue-800 rounded-full text-sm"
                >
                  {app}
                  <button
                    type="button"
                    onClick={() => removeApplication(index)}
                    className="ml-2 text-scientific-blue-600 hover:text-scientific-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </motion.div>

          {/* Stock & Pricing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h2 className="text-xl font-bold text-primary-800 mb-4">Stok ve Fiyatlandırma</h2>
            
            <div className="grid md:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fiyat
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Para Birimi
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                >
                  <option value="₺">₺ TL</option>
                  <option value="$">$ USD</option>
                  <option value="€">€ EUR</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stok Miktarı
                </label>
                <input
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => handleInputChange('stockQuantity', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min. Stok Seviyesi
                </label>
                <input
                  type="number"
                  value={formData.minStockLevel}
                  onChange={(e) => handleInputChange('minStockLevel', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-6 flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.stock}
                  onChange={(e) => handleInputChange('stock', e.target.checked)}
                  className="mr-2"
                />
                Stokta var
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="mr-2"
                />
                Aktif
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={(e) => handleInputChange('featured', e.target.checked)}
                  className="mr-2"
                />
                Öne çıkarılmış
              </label>
            </div>
          </motion.div>

          {/* Image Upload Section */}
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

          {/* Chemical Certificates */}
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

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex justify-end space-x-4"
          >
            <button
              type="button"
              onClick={() => navigate('/admin/products')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-scientific-blue-500 text-white rounded-lg hover:bg-scientific-blue-600 disabled:opacity-50"
            >
              {loading ? 'Kaydediliyor...' : (isEdit ? 'Güncelle' : 'Kaydet')}
            </button>
          </motion.div>
        </form>
      </div>
    </AdminLayout>
  )
}

export default AdminProductForm