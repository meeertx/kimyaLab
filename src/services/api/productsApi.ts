import { apiClient, PaginatedResponse } from './apiClient'

// Backend product types (matching backend schema)
export interface BackendProduct {
  id: string
  name: string
  code: string
  description: string | null
  category: string
  subCategory: string | null
  price: string
  currency: string
  stockQuantity: number
  minStockLevel: number
  unit: string
  images: Array<{
    url: string
    alt: string
    isMain: boolean
  }> | string[]
  technicalSpecs: Array<{
    name: string
    value: string
    unit?: string
  }>
  applications: string[]
  certifications: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  createdBy: string
  categoryId: string
}

export interface BackendCategory {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateProductData {
  name: string
  code: string
  description?: string
  category: string
  subCategory?: string
  price: string
  currency: string
  stockQuantity: number
  minStockLevel: number
  unit: string
  images?: string[]
  technicalSpecs?: Array<{
    name: string
    value: string
    unit?: string
  }>
  applications?: string[]
  certifications?: string[]
  categoryId: string
}

export interface UpdateProductData extends Partial<CreateProductData> {}

export interface ProductFilters {
  category?: string
  subCategory?: string
  priceMin?: number
  priceMax?: number
  inStock?: boolean
  search?: string
  isActive?: boolean
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export class ProductsApi {
  // Get all products with filters and pagination
  static async getProducts(
    filters: ProductFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<BackendProduct>> {
    const params = {
      ...filters,
      ...pagination,
      page: pagination.page?.toString() || '1',
      limit: pagination.limit?.toString() || '20',
    }

    const response = await apiClient.get<PaginatedResponse<BackendProduct>>('/products', params)
    return response.data!
  }

  // Get product by ID
  static async getProductById(id: string): Promise<BackendProduct> {
    const response = await apiClient.get<BackendProduct>(`/products/${id}`)
    return response.data!
  }

  // Get raw product data by ID for admin editing (no conversion/fallbacks)
  static async getRawProductById(id: string): Promise<BackendProduct> {
    const response = await apiClient.get<BackendProduct>(`/products/admin/raw/${id}`)
    return response.data!
  }

  // Search products
  static async searchProducts(
    query: string,
    filters: ProductFilters = {},
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<BackendProduct>> {
    console.log('🔍 ProductsApi.searchProducts called with:', query, filters, pagination)
    
    const params = {
      search: query,
      ...filters,
      ...pagination,
      page: pagination.page?.toString() || '1',
      limit: pagination.limit?.toString() || '20',
    }
    
    console.log('🔄 ProductsApi making API call with params:', params)

    const response = await apiClient.get<PaginatedResponse<BackendProduct>>('/products', params)
    
    console.log('✅ ProductsApi raw response:', response)
    console.log('📊 ProductsApi response.data:', response.data)
    console.log('📊 ProductsApi response.data.data length:', response.data?.data?.length || 0)
    console.log('🔍 ProductsApi response.data.data preview:', response.data?.data?.slice(0, 2))
    
    return response.data!
  }

  // Get products by category
  static async getProductsByCategory(
    categorySlug: string,
    pagination: PaginationParams = {}
  ): Promise<PaginatedResponse<BackendProduct>> {
    const params = {
      ...pagination,
      page: pagination.page?.toString() || '1',
      limit: pagination.limit?.toString() || '20',
    }

    const response = await apiClient.get<PaginatedResponse<BackendProduct>>(
      `/products/category/${categorySlug}`,
      params
    )
    return response.data!
  }

  // Create new product (Admin only)
  static async createProduct(productData: Omit<BackendProduct, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<BackendProduct> {
    const response = await apiClient.post<BackendProduct>('/products', productData)
    return response.data!
  }

  // Update product (Admin only)
  static async updateProduct(id: string, updates: Partial<BackendProduct>): Promise<BackendProduct> {
    const response = await apiClient.put<BackendProduct>(`/products/${id}`, updates)
    return response.data!
  }

  // Delete product (Admin only)
  static async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`)
  }

  // Update product stock (Admin only)
  static async updateStock(
    id: string,
    quantity: number,
    operation: 'add' | 'subtract' | 'set' = 'set'
  ): Promise<BackendProduct> {
    const response = await apiClient.patch<BackendProduct>(`/products/${id}/stock`, {
      quantity,
      operation
    })
    return response.data!
  }

  // Get low stock products (Admin only)
  static async getLowStockProducts(): Promise<BackendProduct[]> {
    const response = await apiClient.get<BackendProduct[]>('/products/low-stock')
    return response.data!
  }

  // Convert backend product to frontend product format
  static convertToFrontendProduct(backendProduct: BackendProduct): any {
    console.log('🔄 Converting backend product:', {
      id: backendProduct.id,
      name: backendProduct.name,
      technicalSpecs: backendProduct.technicalSpecs?.length || 0,
      applications: backendProduct.applications?.length || 0,
      certifications: backendProduct.certifications?.length || 0
    })

    // 🔥 EXTRACT REAL TECHNICAL DATA (NO FALLBACKS) - Show only admin-entered data
    const extractTechnicalData = (specs: Array<{name: string, value: string, unit?: string}>) => {
      const data = {
        brand: '', // Show empty if not provided by admin
        formula: '',
        cas: '',
        purity: '',
        molecularWeight: '',
        grade: ''
      }
      
      if (!specs || !Array.isArray(specs) || specs.length === 0) {
        console.log('ℹ️ No technical specs from admin - showing empty values')
        return data
      }
      
      console.log('✅ Processing admin technical specs:', specs)
      
      specs.forEach(spec => {
        const name = spec.name?.toLowerCase() || ''
        const value = spec.value || ''
        
        if (name.includes('brand') || name.includes('marka')) {
          data.brand = value
        } else if (name.includes('formula') || name.includes('formül') || name.includes('chemical formula')) {
          data.formula = value
        } else if (name.includes('cas') || name.includes('cas number')) {
          data.cas = value
        } else if (name.includes('purity') || name.includes('saflık') || name.includes('assay')) {
          data.purity = value.includes('%') ? value : (value ? `${value}%` : '')
        } else if (name.includes('molecular weight') || name.includes('moleküler ağırlık') || name.includes('mol weight')) {
          data.molecularWeight = value
        } else if (name.includes('grade') || name.includes('kalite')) {
          data.grade = value
        }
      })
      
      return data
    }

    const technicalData = extractTechnicalData(backendProduct.technicalSpecs)
    
    // 🚫 NO FALLBACKS! Show only real admin data

    const convertedProduct = {
      id: backendProduct.id,
      name: backendProduct.name,
      nameEn: backendProduct.name, // Use same name for English
      nameAr: backendProduct.name, // Use same name for Arabic
      productCode: backendProduct.code,
      description: backendProduct.description || `${backendProduct.name} - Yüksek kaliteli kimyasal ürün`,
      descriptionEn: backendProduct.description || `${backendProduct.name} - High quality chemical product`,
      descriptionAr: backendProduct.description || `${backendProduct.name} - منتج كيميائي عالي الجودة`,
      category: backendProduct.category,
      subcategory: backendProduct.subCategory || backendProduct.category,
      subcategoryId: backendProduct.subCategory ? `${backendProduct.categoryId}_sub` : undefined,
      categoryId: backendProduct.categoryId,
      price: parseFloat(backendProduct.price),
      currency: backendProduct.currency,
      unit: backendProduct.unit,
      stock: backendProduct.stockQuantity > 0,
      stockQuantity: backendProduct.stockQuantity,
      minStockLevel: backendProduct.minStockLevel,
      
      // Enhanced technical data
      brand: technicalData.brand,
      formula: technicalData.formula,
      cas: technicalData.cas,
      purity: technicalData.purity,
      molecularWeight: technicalData.molecularWeight,
      grade: technicalData.grade,
      
      // Images with proper handling for both string array and object array
      images: backendProduct.images?.length > 0
        ? backendProduct.images.map((img, idx) => ({
            id: `img_${idx}`,
            url: typeof img === 'string' ? img : (img as any).url,
            type: idx === 0 ? 'main' : 'gallery',
            alt: typeof img === 'string' ? `${backendProduct.name} resim ${idx + 1}` : (img as any).alt,
            order: idx
          }))
        : [{
            id: 'default',
            url: '🧪',
            type: 'main',
            alt: backendProduct.name,
            order: 0
          }],
      
      thumbnailImage: backendProduct.images?.length > 0
        ? (typeof backendProduct.images[0] === 'string' ? backendProduct.images[0] : (backendProduct.images[0] as any).url)
        : '🧪',
      
      // Enhanced specifications
      specifications: {
        appearance: 'Varies',
        state: backendProduct.technicalSpecs?.find(s => s.name?.toLowerCase().includes('state'))?.value || 'solid',
        ...backendProduct.technicalSpecs?.reduce((acc, spec) => {
          acc[spec.name] = spec.value
          return acc
        }, {} as any)
      },
      
      // Technical specs and applications
      technicalSpecs: backendProduct.technicalSpecs || [],
      applications: backendProduct.applications || ['Genel laboratuvar kullanımı'],
      usageAreas: backendProduct.applications || ['Laboratuvar', 'Araştırma'],
      certifications: backendProduct.certifications || [],
      
      // Documents (empty for now, will be populated by backend)
      documents: [],
      
      // Enhanced searchable fields
      searchableFields: {
        serialNumber: backendProduct.code,
        modelNumber: backendProduct.code,
        alternativeNames: [backendProduct.name],
        synonyms: backendProduct.applications || [],
        tags: [...backendProduct.applications, ...backendProduct.certifications]
      },
      
      // Metadata
      tags: [...backendProduct.applications, ...backendProduct.certifications, technicalData.brand],
      featured: backendProduct.isActive && backendProduct.stockQuantity > 0,
      isActive: backendProduct.isActive,
      createdAt: backendProduct.createdAt,
      updatedAt: backendProduct.updatedAt,
      
      // Additional required fields for compatibility
      formulation: [],
      packaging: [{
        id: 'default',
        type: 'Bottle',
        size: '500ml',
        quantity: 1,
        unit: backendProduct.unit,
        price: parseFloat(backendProduct.price),
        availability: backendProduct.stockQuantity > 0
      }],
      storageConditions: {
        temperature: {
          min: 15,
          max: 25,
          unit: 'C',
          description: 'Oda sıcaklığında saklayın'
        },
        lightConditions: 'protected',
        specialRequirements: ['Kuru yerde saklayın'],
        shelfLife: {
          duration: 24,
          unit: 'months',
          conditions: 'Uygun koşullarda'
        }
      }
    }
    
    console.log('✅ Frontend product converted successfully:', {
      id: convertedProduct.id,
      name: convertedProduct.name,
      brand: convertedProduct.brand,
      cas: convertedProduct.cas,
      formula: convertedProduct.formula,
      price: convertedProduct.price,
      stock: convertedProduct.stock
    })
    
    return convertedProduct
  }

  // Batch convert backend products to frontend format
  static convertToFrontendProducts(backendProducts: BackendProduct[]): any[] {
    return backendProducts.map(this.convertToFrontendProduct)
  }
}