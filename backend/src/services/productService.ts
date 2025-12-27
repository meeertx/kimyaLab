import { prisma } from '../config/database'
import {
  Product,
  ProductFilter,
  PaginationQuery,
  PaginatedResponse,
  TechnicalSpec
} from '../types/index'
import {
  NotFoundError,
  ConflictError,
  DatabaseError
} from '../middleware/errorHandler'

export class ProductService {
  // Create new product
  static async createProduct(
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    createdBy: string
  ): Promise<Product> {
    try {
      console.log('🚀 ProductService.createProduct received data:', {
        name: productData.name,
        code: productData.code,
        technicalSpecs: productData.technicalSpecs,
        technicalSpecsLength: Array.isArray(productData.technicalSpecs) ? productData.technicalSpecs.length : 'not array',
        technicalSpecsType: typeof productData.technicalSpecs,
        applications: productData.applications,
        price: productData.price,
        categoryId: productData.categoryId
      })

      // Check if product code already exists
      const existingProduct = await prisma.product.findUnique({
        where: { code: productData.code }
      })

      if (existingProduct) {
        throw new ConflictError('Product code already exists')
      }

      // Prepare data for database - ensure technicalSpecs is properly formatted
      const dbData = {
        ...productData,
        createdBy,
        technicalSpecs: productData.technicalSpecs || [],
        applications: productData.applications || [],
        certifications: productData.certifications || [],
        images: productData.images || []
      }

      console.log('💾 Creating product in database with data:', {
        name: dbData.name,
        code: dbData.code,
        technicalSpecs: dbData.technicalSpecs,
        technicalSpecsType: typeof dbData.technicalSpecs,
        technicalSpecsIsArray: Array.isArray(dbData.technicalSpecs)
      })

      // Create product
      const product = await prisma.product.create({
        data: dbData,
        include: {
          categoryRef: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          inventory: true
        }
      })

      console.log('✅ Product created successfully in database:', {
        id: product.id,
        name: product.name,
        technicalSpecs: product.technicalSpecs,
        technicalSpecsLength: Array.isArray(product.technicalSpecs) ? product.technicalSpecs.length : 'not array'
      })

      const formattedProduct = this.formatProductResponse(product)
      
      // 🚀 REAL-TIME SYNC: Send WebSocket notification for product creation
      try {
        // Import io dynamically to avoid circular dependency issues
        const appModule = await import('../app')
        const io = appModule.io
        if (io) {
          // Notify all connected clients about new product
          io.emit('productCreated', {
            type: 'product_created',
            product: formattedProduct,
            message: `Yeni ürün eklendi: ${formattedProduct.name}`,
            timestamp: new Date().toISOString()
          })
          
          // Notify product room specifically
          io.to('products').emit('productCreated', {
            type: 'product_created',
            product: formattedProduct,
            message: `Yeni ürün eklendi: ${formattedProduct.name}`,
            timestamp: new Date().toISOString()
          })
          
          console.log('📡 Real-time notification sent for product creation:', formattedProduct.id)
        }
      } catch (wsError) {
        console.warn('⚠️ WebSocket notification failed for product creation:', wsError)
      }

      return formattedProduct
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error
      }
      console.error('Error creating product:', error)
      throw new DatabaseError('Failed to create product')
    }
  }

  // Get product by ID
  static async getProductById(id: string, includeInactive = false): Promise<Product> {
    try {
      const product = await prisma.product.findUnique({
        where: {
          id,
          ...(includeInactive ? {} : { isActive: true })
        },
        include: {
          categoryRef: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          inventory: true
        }
      })

      if (!product) {
        throw new NotFoundError('Product not found')
      }

      return this.formatProductResponse(product)
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      console.error('Error fetching product:', error)
      throw new DatabaseError('Failed to fetch product')
    }
  }

  // Get raw product data by ID for admin editing (no formatting/fallbacks)
  static async getRawProductById(id: string): Promise<any> {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          categoryRef: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          inventory: true
        }
      })

      if (!product) {
        throw new NotFoundError('Product not found')
      }

      console.log('🔍 Raw product data for admin editing:', {
        id: product.id,
        name: product.name,
        technicalSpecs: product.technicalSpecs,
        technicalSpecsType: typeof product.technicalSpecs,
        technicalSpecsLength: Array.isArray(product.technicalSpecs) ? product.technicalSpecs.length : 'not array',
        applications: product.applications,
        applicationsLength: Array.isArray(product.applications) ? product.applications.length : 'not array'
      })

      // Return raw data without formatting for admin editing
      return {
        ...product,
        categoryId: product.categoryId || product.categoryRef?.id || '',
        price: product.price.toString() // Only convert price to string for consistency
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      console.error('Error fetching raw product data:', error)
      throw new DatabaseError('Failed to fetch raw product data')
    }
  }

  // Get products with filtering and pagination
  static async getProducts(
    filters: ProductFilter = {},
    pagination: PaginationQuery = {}
  ): Promise<PaginatedResponse<Product>> {
    try {
      const {
        category,
        subCategory,
        priceMin,
        priceMax,
        inStock,
        search,
        isActive = true
      } = filters

      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = pagination

      const skip = (page - 1) * limit

      // Build where clause
      const where: any = {
        isActive
      }

      if (category) {
        where.category = category
      }

      if (subCategory) {
        where.subCategory = subCategory
      }

      if (priceMin !== undefined || priceMax !== undefined) {
        where.price = {}
        if (priceMin !== undefined) where.price.gte = priceMin
        if (priceMax !== undefined) where.price.lte = priceMax
      }

      if (inStock !== undefined) {
        if (inStock) {
          where.stockQuantity = { gt: 0 }
        } else {
          where.stockQuantity = 0
        }
      }

      if (search) {
        console.log('🔍 Enhanced search query:', search)
        
        where.OR = [
          // Basic field searches
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          
          // Application array search
          { applications: { has: search } },
          
          // FIXED: Proper Prisma JSON search syntax
          // Search within technicalSpecs JSON for any value containing search term
          {
            technicalSpecs: {
              array_contains: {
                value: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            }
          },
          
          // Also search in technicalSpecs names
          {
            technicalSpecs: {
              array_contains: {
                name: {
                  contains: search,
                  mode: 'insensitive'
                }
              }
            }
          }
        ]
        
        console.log('🔍 Search conditions:', where.OR)
        console.log('🔍 Complete where clause:', JSON.stringify(where, null, 2))
      }

      // Build orderBy clause
      const orderBy: any = {}
      if (sortBy === 'price' || sortBy === 'stockQuantity' || sortBy === 'createdAt') {
        orderBy[sortBy] = sortOrder
      } else {
        orderBy.createdAt = 'desc'
      }

      // Fetch products and total count
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            categoryRef: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            },
            inventory: true
          }
        }),
        prisma.product.count({ where })
      ])

      const pages = Math.ceil(total / limit)

      return {
        data: products.map(product => this.formatProductResponse(product)),
        pagination: {
          page,
          limit,
          total,
          pages
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      throw new DatabaseError('Failed to fetch products')
    }
  }

  // Update product
  static async updateProduct(
    id: string,
    updateData: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>>,
    updatedBy: string
  ): Promise<Product> {
    try {
      // Check if product exists
      const existingProduct = await prisma.product.findUnique({
        where: { id }
      })

      if (!existingProduct) {
        throw new NotFoundError('Product not found')
      }

      // Check if code is being updated and already exists
      if (updateData.code && updateData.code !== existingProduct.code) {
        const codeExists = await prisma.product.findUnique({
          where: { code: updateData.code }
        })

        if (codeExists) {
          throw new ConflictError('Product code already exists')
        }
      }

      // Prepare update data without categoryId conflict
      const { categoryId, ...dataWithoutCategoryId } = updateData as any
      const updatePayload = {
        ...dataWithoutCategoryId,
        updatedAt: new Date()
      }
      
      // Add categoryId separately if provided
      if (categoryId) {
        updatePayload.categoryId = categoryId
      }

      // Update product
      const product = await prisma.product.update({
        where: { id },
        data: updatePayload,
        include: {
          categoryRef: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          inventory: true
        }
      })

      const formattedProduct = this.formatProductResponse(product)
      
      // 🚀 REAL-TIME SYNC: Send WebSocket notification for product update
      try {
        // Import io dynamically to avoid circular dependency issues
        const appModule = await import('../app')
        const io = appModule.io
        if (io) {
          // Notify all connected clients about product update
          io.emit('productUpdated', {
            type: 'product_updated',
            product: formattedProduct,
            message: `Ürün güncellendi: ${formattedProduct.name}`,
            timestamp: new Date().toISOString()
          })
          
          // Notify product room specifically
          io.to('products').emit('productUpdated', {
            type: 'product_updated',
            product: formattedProduct,
            message: `Ürün güncellendi: ${formattedProduct.name}`,
            timestamp: new Date().toISOString()
          })
          
          console.log('📡 Real-time notification sent for product update:', formattedProduct.id)
        }
      } catch (wsError) {
        console.warn('⚠️ WebSocket notification failed for product update:', wsError)
      }

      return formattedProduct
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error
      }
      console.error('Error updating product:', error)
      throw new DatabaseError('Failed to update product')
    }
  }

  // Delete product (soft delete)
  static async deleteProduct(id: string): Promise<void> {
    try {
      const product = await prisma.product.findUnique({
        where: { id }
      })

      if (!product) {
        throw new NotFoundError('Product not found')
      }

      await prisma.product.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      })
      
      // 🚀 REAL-TIME SYNC: Send WebSocket notification for product deletion
      try {
        // Import io dynamically to avoid circular dependency issues
        const appModule = await import('../app')
        const io = appModule.io
        if (io) {
          // Notify all connected clients about product deletion
          io.emit('productDeleted', {
            type: 'product_deleted',
            productId: id,
            message: `Ürün silindi`,
            timestamp: new Date().toISOString()
          })
          
          // Notify product room specifically
          io.to('products').emit('productDeleted', {
            type: 'product_deleted',
            productId: id,
            message: `Ürün silindi`,
            timestamp: new Date().toISOString()
          })
          
          console.log('📡 Real-time notification sent for product deletion:', id)
        }
      } catch (wsError) {
        console.warn('⚠️ WebSocket notification failed for product deletion:', wsError)
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      console.error('Error deleting product:', error)
      throw new DatabaseError('Failed to delete product')
    }
  }

  // Get products by category
  static async getProductsByCategory(
    categorySlug: string,
    pagination: PaginationQuery = {}
  ): Promise<PaginatedResponse<Product>> {
    try {
      console.log('🔍 Searching products for category slug:', categorySlug)
      
      // First, find the category
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
        include: {
          children: true, // Include subcategories
          parent: true    // Include parent info
        }
      })

      if (!category) {
        console.log('❌ Category not found for slug:', categorySlug)
        throw new NotFoundError('Category not found')
      }

      console.log('✅ Found category:', {
        id: category.id,
        name: category.name,
        slug: category.slug,
        isMainCategory: !category.parentId,
        hasSubcategories: category.children.length > 0
      })

      // Use categoryId for proper filtering instead of category name
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = pagination

      const skip = (page - 1) * limit

      // Build where clause - include products from current category AND its subcategories
      let categoryIds: string[] = [category.id]
      
      // If this is a main category, also include products from all its subcategories
      if (category.children.length > 0) {
        const subcategoryIds = category.children.map(child => child.id)
        categoryIds.push(...subcategoryIds)
        console.log(`📂 Including subcategories:`, subcategoryIds)
      }

      const where: any = {
        isActive: true,
        categoryId: {
          in: categoryIds // Use 'in' to match multiple category IDs
        }
      }

      // Build orderBy clause
      const orderBy: any = {}
      if (sortBy === 'price' || sortBy === 'stockQuantity' || sortBy === 'createdAt') {
        orderBy[sortBy] = sortOrder
      } else {
        orderBy.createdAt = 'desc'
      }

      console.log('🔍 Filtering products with where clause:', where)

      // Fetch products and total count
      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            categoryRef: {
              select: {
                id: true,
                name: true,
                slug: true,
                parent: {
                  select: {
                    id: true,
                    name: true,
                    slug: true
                  }
                }
              }
            },
            inventory: true
          }
        }),
        prisma.product.count({ where })
      ])

      console.log('✅ Found products:', { total, count: products.length })

      const pages = Math.ceil(total / limit)

      return {
        data: products.map(product => this.formatProductResponse(product)),
        pagination: {
          page,
          limit,
          total,
          pages
        }
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      console.error('Error fetching products by category:', error)
      throw new DatabaseError('Failed to fetch products by category')
    }
  }

  // Update stock quantity
  static async updateStock(
    id: string,
    quantity: number,
    operation: 'add' | 'subtract' | 'set' = 'set'
  ): Promise<Product> {
    try {
      const product = await prisma.product.findUnique({
        where: { id }
      })

      if (!product) {
        throw new NotFoundError('Product not found')
      }

      let newQuantity: number

      switch (operation) {
        case 'add':
          newQuantity = product.stockQuantity + quantity
          break
        case 'subtract':
          newQuantity = Math.max(0, product.stockQuantity - quantity)
          break
        case 'set':
        default:
          newQuantity = quantity
          break
      }

      const updatedProduct = await prisma.product.update({
        where: { id },
        data: {
          stockQuantity: newQuantity,
          updatedAt: new Date()
        },
        include: {
          categoryRef: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          inventory: true
        }
      })

      const formattedProduct = this.formatProductResponse(updatedProduct)
      
      // 🚀 REAL-TIME SYNC: Send WebSocket notification for stock update
      try {
        // Import io dynamically to avoid circular dependency issues
        const appModule = await import('../app')
        const io = appModule.io
        if (io) {
          // Check if it's low stock
          const isLowStock = newQuantity <= (updatedProduct.minStockLevel || 10)
          
          // Notify all connected clients about stock update
          io.emit('stockUpdated', {
            type: 'inventory_updated',
            product: formattedProduct,
            stockQuantity: newQuantity,
            message: `Stok güncellendi: ${formattedProduct.name}`,
            timestamp: new Date().toISOString()
          })
          
          // If low stock, send warning
          if (isLowStock) {
            io.emit('lowStockWarning', {
              type: 'low_stock_warning',
              product: formattedProduct,
              stockQuantity: newQuantity,
              minStockLevel: updatedProduct.minStockLevel,
              message: `Düşük stok uyarısı: ${formattedProduct.name} (${newQuantity} adet kaldı)`,
              timestamp: new Date().toISOString()
            })
            
            console.log('⚠️ Low stock warning sent for:', formattedProduct.name)
          }
          
          console.log('📡 Real-time notification sent for stock update:', formattedProduct.id)
        }
      } catch (wsError) {
        console.warn('⚠️ WebSocket notification failed for stock update:', wsError)
      }

      return formattedProduct
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      console.error('Error updating stock:', error)
      throw new DatabaseError('Failed to update stock')
    }
  }

  // Get low stock products
  static async getLowStockProducts(): Promise<Product[]> {
    try {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          stockQuantity: {
            lte: prisma.product.fields.minStockLevel
          }
        },
        include: {
          categoryRef: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          inventory: true
        },
        orderBy: {
          stockQuantity: 'asc'
        }
      })

      return products.map(product => this.formatProductResponse(product))
    } catch (error) {
      console.error('Error fetching low stock products:', error)
      throw new DatabaseError('Failed to fetch low stock products')
    }
  }

  // Format product response
  private static formatProductResponse(product: any): Product {
    // Convert images array to object format for frontend compatibility
    const formatImages = (images: string[] | any[]): any[] => {
      if (!Array.isArray(images)) return []
      
      return images.map((image, index) => {
        // If it's already an object with url, return as is
        if (typeof image === 'object' && image.url) {
          return image
        }
        
        // If it's a string URL, convert to object format
        if (typeof image === 'string') {
          return {
            url: image,
            alt: `Product image ${index + 1}`,
            isMain: index === 0
          }
        }
        
        return image
      })
    }

    const formattedProduct = {
      id: product.id,
      name: product.name,
      code: product.code,
      description: product.description,
      category: product.categoryRef?.name || product.category,
      subCategory: product.subCategory,
      price: product.price.toString(), // Convert to string for frontend compatibility
      currency: product.currency,
      stockQuantity: product.stockQuantity,
      minStockLevel: product.minStockLevel,
      unit: product.unit,
      images: formatImages(product.images || []),
      technicalSpecs: product.technicalSpecs || [],
      applications: product.applications || [],
      certifications: product.certifications || [],
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      createdBy: product.createdBy,
      categoryId: product.categoryId || product.categoryRef?.id || ''
    }
    
    console.log('🔍 Backend formatting product:', {
      id: formattedProduct.id,
      name: formattedProduct.name,
      price: formattedProduct.price,
      isActive: formattedProduct.isActive,
      images: formattedProduct.images,
      imagesLength: Array.isArray(formattedProduct.images) ? formattedProduct.images.length : 'not array',
      imagesType: typeof formattedProduct.images,
      technicalSpecs: formattedProduct.technicalSpecs,
      technicalSpecsLength: Array.isArray(formattedProduct.technicalSpecs) ? formattedProduct.technicalSpecs.length : 'not array',
      technicalSpecsType: typeof formattedProduct.technicalSpecs,
      applications: formattedProduct.applications,
      applicationsLength: Array.isArray(formattedProduct.applications) ? formattedProduct.applications.length : 'not array'
    })
    
    return formattedProduct
  }

  // Search products with advanced filters
  static async searchProducts(
    query: string,
    filters: ProductFilter = {},
    pagination: PaginationQuery = {}
  ): Promise<PaginatedResponse<Product>> {
    const searchFilters = {
      ...filters,
      search: query
    }

    return this.getProducts(searchFilters, pagination)
  }
}