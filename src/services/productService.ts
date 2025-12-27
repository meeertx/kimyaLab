// PostgreSQL Backend Product Service - Cache temporarily disabled
import {
  ProductsApi,
  CategoriesApi,
  BackendProduct,
  BackendCategory,
  ProductFilters,
  PaginationParams
} from './api'
import { Product, Category, SearchFilters } from '../types'
// import { apiCache, CacheKeys, CacheTTL, SimpleCache } from './cache' // Temporarily disabled

// Product Service - Now using PostgreSQL backend
export class ProductService {
  // Get all products with optional filters (with caching)
  static async getProducts(filters?: SearchFilters, pageSize = 20, lastDoc?: any): Promise<{
    products: Product[]
    lastDoc: any | null
    hasMore: boolean
  }> {
    try {
      const apiFilters: ProductFilters = {
        category: filters?.category,
        inStock: filters?.inStock,
        search: (filters as any)?.search
      }
      
      const pagination: PaginationParams = {
        page: 1,
        limit: pageSize
      }

      const response = await ProductsApi.getProducts(apiFilters, pagination)
      
      // Convert backend products to frontend format
      const frontendProducts = ProductsApi.convertToFrontendProducts(response.data)
      
      return {
        products: frontendProducts,
        lastDoc: null, // PostgreSQL pagination handles this differently
        hasMore: response.pagination ? response.pagination.page < response.pagination.pages : false
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      throw error
    }
  }

  // Get product by ID (with caching)
  static async getProductById(productId: string): Promise<Product | null> {
    try {
      const backendProduct = await ProductsApi.getProductById(productId)
      return ProductsApi.convertToFrontendProduct(backendProduct)
    } catch (error) {
      console.error('Error fetching product:', error)
      return null
    }
  }

  // Get raw product data by ID for admin editing (no fallbacks, original data)
  static async getRawProductById(productId: string): Promise<any | null> {
    try {
      console.log('🔍 Fetching raw product data for admin editing:', productId)
      
      // Use ProductsApi for consistent authentication
      const rawProduct = await ProductsApi.getRawProductById(productId)
      
      console.log('✅ Raw product data received:', {
        id: rawProduct.id,
        name: rawProduct.name,
        technicalSpecs: rawProduct.technicalSpecs,
        technicalSpecsLength: Array.isArray(rawProduct.technicalSpecs) ? rawProduct.technicalSpecs.length : 'not array',
        applications: rawProduct.applications,
        applicationsLength: Array.isArray(rawProduct.applications) ? rawProduct.applications.length : 'not array'
      })

      return rawProduct
    } catch (error) {
      console.error('❌ Error fetching raw product data:', error)
      return null
    }
  }

  // Search products with flexible search (with caching)
  static async searchProducts(searchQuery: string, filters?: SearchFilters): Promise<Product[]> {
    try {
      console.log('🔍 ProductService.searchProducts called with:', searchQuery, filters)
      
      const apiFilters: ProductFilters = {
        category: filters?.category,
        inStock: filters?.inStock,
        search: searchQuery
      }
      
      console.log('🔄 ProductService calling ProductsApi.searchProducts with filters:', apiFilters)
      
      const response = await ProductsApi.searchProducts(searchQuery, apiFilters)
      
      console.log('✅ ProductService received response:', response)
      console.log('📊 ProductService response.data length:', response.data?.length || 0)
      console.log('🔍 ProductService response.data preview:', response.data?.slice(0, 2))
      
      const convertedProducts = ProductsApi.convertToFrontendProducts(response.data)
      
      console.log('🎯 ProductService converted products length:', convertedProducts?.length || 0)
      console.log('🔍 ProductService converted products preview:', convertedProducts?.slice(0, 2))
      
      return convertedProducts
    } catch (error) {
      console.error('❌ ProductService search error:', error)
      throw error
    }
  }

  // Add new product (Admin only) - Convert frontend to backend format
  static async addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Convert frontend product to backend format
      const productAny = productData as any
      
      // Currency mapping: ₺ -> TRY, $ -> USD, € -> EUR
      let currency = 'TRY' // Default
      if (productAny.currency) {
        switch (productAny.currency) {
          case '₺':
            currency = 'TRY'
            break
          case '$':
            currency = 'USD'
            break
          case '€':
            currency = 'EUR'
            break
          case 'TRY':
          case 'USD':
          case 'EUR':
            currency = productAny.currency
            break
          default:
            currency = 'TRY'
        }
      }

      // Generate proper product code if not provided
      let productCode = productAny.productCode
      if (!productCode) {
        productCode = `PRD-${Date.now()}`
      }
      // Ensure code is uppercase and valid format
      productCode = productCode.toUpperCase().replace(/[^A-Z0-9\-_]/g, '-')

      // Get categoryId from category name if not provided
      let categoryId = productAny.categoryId
      if (!categoryId && productData.category) {
        try {
          // Try to get categories and find matching one
          const categories = await CategoriesApi.getCategories()
          const matchingCategory = categories.find(cat =>
            cat.slug === productData.category ||
            cat.name.toLowerCase() === (productData.category || '').toLowerCase()
          )
          if (matchingCategory) {
            categoryId = matchingCategory.id
          } else {
            // If no category found, use the first available or create default
            categoryId = categories[0]?.id || 'default-category'
          }
        } catch (error) {
          console.warn('Could not fetch categories, using default')
          categoryId = 'default-category'
        }
      }

      const backendData: Omit<BackendProduct, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
        name: productData.name,
        code: productCode,
        description: productData.description || '',
        category: productData.category || '',
        subCategory: productAny.subCategory || null,
        price: productData.price.toString(), // Convert number to string
        currency: currency,
        stockQuantity: productAny.stockQuantity || 0,
        minStockLevel: productAny.minStockLevel || 0,
        unit: productAny.unit || 'adet',
        images: productAny.images ? productAny.images.map((img: any) => typeof img === 'string' ? img : img.url) : [],
        technicalSpecs: productAny.technicalSpecs || [],
        applications: productAny.applications || [],
        certifications: productAny.certifications || [],
        isActive: productAny.isActive !== false,
        categoryId: categoryId
      }
      
      console.log('🚀 Sending product data to backend:', backendData)
      const response = await ProductsApi.createProduct(backendData)
      return response.id
    } catch (error) {
      console.error('❌ Error adding product:', error)
      throw error
    }
  }

  // Update product (Admin only)
  static async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    try {
      // Convert frontend updates to backend format
      const updatesAny = updates as any
      const backendUpdates: Partial<BackendProduct> = {}
      
      if (updates.name) backendUpdates.name = updates.name
      if (updatesAny.productCode) {
        backendUpdates.code = updatesAny.productCode.toUpperCase().replace(/[^A-Z0-9\-_]/g, '-')
      }
      if (updates.description) backendUpdates.description = updates.description
      if (updates.category) backendUpdates.category = updates.category
      if (updatesAny.subCategory) backendUpdates.subCategory = updatesAny.subCategory
      if (updates.price !== undefined) backendUpdates.price = updates.price.toString()
      
      // Handle currency mapping
      if (updatesAny.currency) {
        switch (updatesAny.currency) {
          case '₺':
            backendUpdates.currency = 'TRY'
            break
          case '$':
            backendUpdates.currency = 'USD'
            break
          case '€':
            backendUpdates.currency = 'EUR'
            break
          case 'TRY':
          case 'USD':
          case 'EUR':
            backendUpdates.currency = updatesAny.currency
            break
          default:
            backendUpdates.currency = 'TRY'
        }
      }
      
      if (updatesAny.stockQuantity !== undefined) backendUpdates.stockQuantity = updatesAny.stockQuantity
      if (updatesAny.minStockLevel !== undefined) backendUpdates.minStockLevel = updatesAny.minStockLevel
      if (updatesAny.unit) backendUpdates.unit = updatesAny.unit
      if (updatesAny.images) backendUpdates.images = updatesAny.images.map ? updatesAny.images.map((img: any) => typeof img === 'string' ? img : img.url) : updatesAny.images
      if (updatesAny.technicalSpecs) backendUpdates.technicalSpecs = updatesAny.technicalSpecs
      if (updatesAny.applications) backendUpdates.applications = updatesAny.applications
      if (updatesAny.certifications) backendUpdates.certifications = updatesAny.certifications
      if (updatesAny.isActive !== undefined) backendUpdates.isActive = updatesAny.isActive
      if (updatesAny.categoryId) backendUpdates.categoryId = updatesAny.categoryId

      console.log('🚀 Updating product with data:', backendUpdates)
      await ProductsApi.updateProduct(productId, backendUpdates)
    } catch (error) {
      console.error('❌ Error updating product:', error)
      throw error
    }
  }

  // Delete product (Admin only)
  static async deleteProduct(productId: string): Promise<void> {
    try {
      await ProductsApi.deleteProduct(productId)
    } catch (error) {
      console.error('Error deleting product:', error)
      throw error
    }
  }

  // Get products by category (with caching)
  static async getProductsByCategory(categorySlug: string): Promise<Product[]> {
    try {
      console.log('🔄 Frontend ProductService getting products for category:', categorySlug)
      const response = await ProductsApi.getProductsByCategory(categorySlug, { limit: 1000 })
      console.log('✅ Frontend ProductService received:', response.data?.length || 0, 'products')
      return ProductsApi.convertToFrontendProducts(response.data)
    } catch (error) {
      console.error('Error fetching products by category:', error)
      throw error
    }
  }

  // Get featured products (with caching)
  static async getFeaturedProducts(count = 10): Promise<Product[]> {
    try {
      const response = await ProductsApi.getProducts({}, { limit: count })
      const frontendProducts = ProductsApi.convertToFrontendProducts(response.data)
      const featuredProducts = frontendProducts.filter(p => p.featured).slice(0, count)
      
      // If no featured products found, use first products as featured
      return featuredProducts.length > 0 ? featuredProducts : frontendProducts.slice(0, count)
    } catch (error) {
      console.error('Error fetching featured products:', error)
      throw error
    }
  }

  // Polling-based product updates (optimized intervals)
  static subscribeToProduct(productId: string, callback: (product: Product | null) => void): (() => void) | null {
    console.log('🔄 ProductService.subscribeToProduct called for:', productId)
    
    // Initial load
    this.getProductById(productId).then(product => {
      console.log('✅ ProductService.subscribeToProduct initial load success:', !!product)
      callback(product)
    }).catch(error => {
      console.error('❌ Error in initial product load:', error)
      callback(null)
    })

    const intervalId = setInterval(async () => {
      try {
        console.log('🔄 ProductService.subscribeToProduct polling for:', productId)
        const product = await this.getProductById(productId)
        console.log('✅ ProductService.subscribeToProduct poll success:', !!product)
        callback(product)
      } catch (error) {
        console.error('❌ Error in product subscription:', error)
        callback(null)
      }
    }, 30000) // Poll every 30 seconds (was 5 seconds)
    
    return () => clearInterval(intervalId)
  }

  // Polling-based products list updates (optimized intervals)
  static subscribeToProducts(
    filters: SearchFilters | undefined,
    callback: (products: Product[]) => void,
    pageSize = 20
  ): (() => void) | null {
    // Initial load
    this.getProducts(filters, pageSize).then(({ products }) => callback(products)).catch(error => {
      console.error('Error in initial products load:', error)
      callback([])
    })

    const intervalId = setInterval(async () => {
      try {
        const { products } = await this.getProducts(filters, pageSize)
        callback(products)
      } catch (error) {
        console.error('Error in products subscription:', error)
        callback([])
      }
    }, 60000) // Poll every 1 minute (was 10 seconds)
    
    return () => clearInterval(intervalId)
  }

  // Polling-based featured products updates (optimized intervals)
  static subscribeToFeaturedProducts(
    callback: (products: Product[]) => void,
    count = 10
  ): (() => void) | null {
    // Initial load
    this.getFeaturedProducts(count).then(callback).catch(error => {
      console.error('Error in initial featured products load:', error)
      callback([])
    })

    const intervalId = setInterval(async () => {
      try {
        const products = await this.getFeaturedProducts(count)
        callback(products)
      } catch (error) {
        console.error('Error in featured products subscription:', error)
        callback([])
      }
    }, 2 * 60 * 1000) // Poll every 2 minutes (was 15 seconds)
    
    return () => clearInterval(intervalId)
  }
}

// Category Service - Now using PostgreSQL backend
export class CategoryService {
  // Get all categories (with caching)
  static async getCategories(): Promise<Category[]> {
    try {
      const backendCategories = await CategoriesApi.getCategories()
      return CategoriesApi.convertToFrontendCategories(backendCategories)
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  }

  // Get category by ID (with caching)
  static async getCategoryById(categoryId: string): Promise<Category | null> {
    try {
      const backendCategory = await CategoriesApi.getCategoryById(categoryId)
      return CategoriesApi.convertToFrontendCategory(backendCategory)
    } catch (error) {
      console.error('Error fetching category:', error)
      return null
    }
  }

  // Get subcategories by parent ID
  static async getSubcategoriesByParent(parentId: string): Promise<Category[]> {
    try {
      const allCategories = await CategoriesApi.getCategories()
      const subcategories = allCategories.filter((cat: BackendCategory) => cat.parentId === parentId)
      return CategoriesApi.convertToFrontendCategories(subcategories)
    } catch (error) {
      console.error('Error fetching subcategories:', error)
      throw error
    }
  }

  // Add new category (Admin only) - Convert frontend to backend format
  static async addCategory(categoryData: Omit<Category, 'id'>): Promise<string> {
    try {
      const categoryAny = categoryData as any
      const backendData: Omit<BackendCategory, 'id' | 'createdAt' | 'updatedAt'> = {
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description || null,
        parentId: categoryAny.parentId || null,
        isActive: categoryAny.isActive !== false
      }
      
      const response = await CategoriesApi.createCategory(backendData as any)
      return response.id
    } catch (error) {
      console.error('Error adding category:', error)
      throw error
    }
  }

  // Update category (Admin only)
  static async updateCategory(categoryId: string, updates: Partial<Category>): Promise<void> {
    try {
      const updatesAny = updates as any
      const backendUpdates: Partial<BackendCategory> = {}
      
      if (updates.name) backendUpdates.name = updates.name
      if (updates.slug) backendUpdates.slug = updates.slug
      if (updates.description) backendUpdates.description = updates.description
      if (updatesAny.parentId !== undefined) backendUpdates.parentId = updatesAny.parentId
      if (updatesAny.isActive !== undefined) backendUpdates.isActive = updatesAny.isActive
      if (updatesAny.order !== undefined) (backendUpdates as any).order = updatesAny.order

      await CategoriesApi.updateCategory(categoryId, backendUpdates)
    } catch (error) {
      console.error('Error updating category:', error)
      throw error
    }
  }

  // Delete category (Admin only)
  static async deleteCategory(categoryId: string): Promise<void> {
    try {
      await CategoriesApi.deleteCategory(categoryId)
    } catch (error) {
      console.error('Error deleting category:', error)
      throw error
    }
  }

  // Polling-based categories updates (optimized intervals)
  static subscribeToCategories(callback: (categories: Category[]) => void): (() => void) | null {
    // Initial load
    this.getCategories().then(callback).catch(error => {
      console.error('Error in initial categories load:', error)
      callback([])
    })

    // Poll less frequently since categories don't change often
    const intervalId = setInterval(async () => {
      try {
        const categories = await this.getCategories()
        callback(categories)
      } catch (error) {
        console.error('Error in categories subscription:', error)
        callback([])
      }
    }, 5 * 60 * 1000) // Poll every 5 minutes (was 30 seconds)
    
    return () => clearInterval(intervalId)
  }
}

// Inventory Service - Simplified for PostgreSQL backend
export class InventoryService {
  // Get inventory for product (now part of product data)
  static async getInventoryByProductId(productId: string): Promise<any | null> {
    try {
      const product = await ProductService.getProductById(productId)
      if (product) {
        return {
          productId,
          stock: product.stock,
          stockQuantity: product.stockQuantity,
          minStockLevel: product.minStockLevel || 0,
          lastUpdated: product.updatedAt
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching inventory:', error)
      throw error
    }
  }

  // Update stock
  static async updateStock(
    productId: string, 
    newQuantity: number, 
    reason: string = 'Manual update'
  ): Promise<void> {
    try {
      await ProductService.updateProduct(productId, {
        stockQuantity: newQuantity,
        stock: newQuantity > 0
      })
    } catch (error) {
      console.error('Error updating stock:', error)
      throw error
    }
  }

  // Get low stock products
  static async getLowStockProducts(): Promise<Product[]> {
    try {
      const { products } = await ProductService.getProducts({}, 1000)
      return products.filter(product =>
        product.stock &&
        (product.stockQuantity || 0) <= (product.minStockLevel || 10)
      )
    } catch (error) {
      console.error('Error fetching low stock products:', error)
      throw error
    }
  }

  // Polling-based inventory updates (optimized intervals)
  static subscribeToInventory(productId: string, callback: (inventory: any | null) => void): (() => void) | null {
    // Initial load
    this.getInventoryByProductId(productId).then(callback).catch(error => {
      console.error('Error in initial inventory load:', error)
      callback(null)
    })

    const intervalId = setInterval(async () => {
      try {
        const inventory = await this.getInventoryByProductId(productId)
        callback(inventory)
      } catch (error) {
        console.error('Error in inventory subscription:', error)
        callback(null)
      }
    }, 30000) // Poll every 30 seconds (was 5 seconds)
    
    return () => clearInterval(intervalId)
  }
}

// Document Service - Simplified (documents now handled by backend)
export class DocumentService {
  // Upload document metadata
  static async addDocument(documentData: {
    productId: string
    name: string
    description?: string
    type: string
    fileType: string
    url: string
    size: string
    language: string
    version?: string
  }): Promise<string> {
    try {
      // This would integrate with the backend's document upload API
      console.log('Document upload would be handled by backend:', documentData)
      return 'mock-document-id'
    } catch (error) {
      console.error('Error adding document:', error)
      throw error
    }
  }

  // Get documents by product ID
  static async getDocumentsByProductId(productId: string): Promise<any[]> {
    try {
      // This would fetch documents from backend
      console.log('Fetching documents for product:', productId)
      return []
    } catch (error) {
      console.error('Error fetching documents:', error)
      throw error
    }
  }

  // Delete document
  static async deleteDocument(documentId: string): Promise<void> {
    try {
      // This would delete document via backend API
      console.log('Deleting document:', documentId)
    } catch (error) {
      console.error('Error deleting document:', error)
      throw error
    }
  }
}

// Admin Service - Using PostgreSQL backend
export class AdminService {
  // Check if user is admin (simplified - backend handles auth)
  static async isUserAdmin(userId: string): Promise<boolean> {
    try {
      // This would be handled by the auth API
      console.log('Admin check for user:', userId)
      return true // Simplified for now
    } catch (error) {
      console.error('Error checking admin status:', error)
      return false
    }
  }

  // Get dashboard stats
  static async getDashboardStats(): Promise<{
    totalProducts: number
    activeProducts: number
    lowStockProducts: number
    totalCategories: number
  }> {
    try {
      const [products, categories, lowStockProducts] = await Promise.all([
        ProductService.getProducts({}, 1000),
        CategoryService.getCategories(),
        InventoryService.getLowStockProducts()
      ])

      const activeProducts = products.products.filter(p => p.isActive !== false)

      return {
        totalProducts: products.products.length,
        activeProducts: activeProducts.length,
        lowStockProducts: lowStockProducts.length,
        totalCategories: categories.length
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw error
    }
  }

  // Polling-based dashboard stats updates
  static subscribeToDashboardStats(callback: (stats: {
    totalProducts: number
    activeProducts: number
    lowStockProducts: number
    totalCategories: number
  }) => void): (() => void) | null {
    const intervalId = setInterval(async () => {
      try {
        const stats = await this.getDashboardStats()
        callback(stats)
      } catch (error) {
        console.error('Error fetching real-time stats:', error)
      }
    }, 20000) // Poll every 20 seconds

    return () => clearInterval(intervalId)
  }
}

// Status indicator
console.log('🚀 ProductService: Using PostgreSQL Backend (Firebase removed)')