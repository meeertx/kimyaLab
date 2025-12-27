import { Router, Request, Response } from 'express'
import { ProductService } from '../services/productService.js'
import { 
  validateProduct, 
  validateProductUpdate, 
  validateId,
  validatePagination,
  handleValidationErrors 
} from '../middleware/validation.js'
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { ApiResponse, Product, PaginatedResponse, ProductFilter } from '../types/index.js'

const router = Router()

// Get all products (public with optional auth for personalization)
router.get('/',
  optionalAuth,
  validatePagination,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response<ApiResponse<PaginatedResponse<Product>>>) => {
    const filters: ProductFilter = {
      category: (req.query.category === 'undefined' || !req.query.category) ? undefined : req.query.category as string,
      subCategory: (req.query.subCategory === 'undefined' || !req.query.subCategory) ? undefined : req.query.subCategory as string,
      priceMin: req.query.priceMin ? Number(req.query.priceMin) : undefined,
      priceMax: req.query.priceMax ? Number(req.query.priceMax) : undefined,
      inStock: req.query.inStock === 'true' ? true : req.query.inStock === 'false' ? false : undefined,
      search: req.query.search as string,
      isActive: req.user?.role === 'ADMIN' ? undefined : true // Admin can see inactive products
    }

    const pagination = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    }

    const result = await ProductService.getProducts(filters, pagination)
    
    res.json({
      success: true,
      data: result,
      message: 'Products retrieved successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Search products
router.get('/search',
  optionalAuth,
  validatePagination,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response<ApiResponse<PaginatedResponse<Product>>>) => {
    const query = req.query.q as string
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query required',
        message: 'Please provide a search query',
        timestamp: new Date().toISOString()
      })
    }

    const filters: ProductFilter = {
      category: (req.query.category === 'undefined' || !req.query.category) ? undefined : req.query.category as string,
      subCategory: (req.query.subCategory === 'undefined' || !req.query.subCategory) ? undefined : req.query.subCategory as string,
      priceMin: req.query.priceMin ? Number(req.query.priceMin) : undefined,
      priceMax: req.query.priceMax ? Number(req.query.priceMax) : undefined,
      inStock: req.query.inStock === 'true' ? true : req.query.inStock === 'false' ? false : undefined,
      isActive: req.user?.role === 'ADMIN' ? undefined : true
    }

    const pagination = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    }

    const result = await ProductService.searchProducts(query, filters, pagination)
    
    res.json({
      success: true,
      data: result,
      message: 'Products found successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Get products by category
router.get('/category/:slug',
  optionalAuth,
  validatePagination,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response<ApiResponse<PaginatedResponse<Product>>>) => {
    const categorySlug = req.params.slug
    
    const pagination = {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc'
    }

    const result = await ProductService.getProductsByCategory(categorySlug, pagination)
    
    res.json({
      success: true,
      data: result,
      message: 'Category products retrieved successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Get single product by ID (public)
router.get('/:id',
  validateId,
  handleValidationErrors,
  optionalAuth,
  asyncHandler(async (req: Request, res: Response<ApiResponse<Product>>) => {
    const includeInactive = req.user?.role === 'ADMIN'
    const result = await ProductService.getProductById(req.params.id, includeInactive)
    
    res.json({
      success: true,
      data: result,
      message: 'Product retrieved successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Get raw product data for admin editing (admin only)
router.get('/admin/raw/:id',
  authenticateToken,
  requireAdmin,
  validateId,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response<ApiResponse<any>>) => {
    const result = await ProductService.getRawProductById(req.params.id)
    
    res.json({
      success: true,
      data: result,
      message: 'Raw product retrieved successfully for admin editing',
      timestamp: new Date().toISOString()
    })
  })
)

// Create new product (admin only)
router.post('/',
  authenticateToken,
  requireAdmin,
  validateProduct,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response<ApiResponse<Product>>) => {
    const createdBy = req.userId!
    const result = await ProductService.createProduct(req.body, createdBy)
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Product created successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Update product (admin only)
router.put('/:id',
  authenticateToken,
  requireAdmin,
  validateProductUpdate,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response<ApiResponse<Product>>) => {
    const updatedBy = req.userId!
    const result = await ProductService.updateProduct(req.params.id, req.body, updatedBy)
    
    res.json({
      success: true,
      data: result,
      message: 'Product updated successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Delete product (soft delete, admin only)
router.delete('/:id',
  authenticateToken,
  requireAdmin,
  validateId,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    await ProductService.deleteProduct(req.params.id)
    
    res.json({
      success: true,
      message: 'Product deleted successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Update stock quantity (admin only)
router.patch('/:id/stock',
  authenticateToken,
  requireAdmin,
  validateId,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response<ApiResponse<Product>>) => {
    const { quantity, operation = 'set' } = req.body
    
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid quantity',
        message: 'Quantity must be a non-negative number',
        timestamp: new Date().toISOString()
      })
    }

    if (!['add', 'subtract', 'set'].includes(operation)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid operation',
        message: 'Operation must be one of: add, subtract, set',
        timestamp: new Date().toISOString()
      })
    }

    const result = await ProductService.updateStock(req.params.id, quantity, operation)
    
    res.json({
      success: true,
      data: result,
      message: 'Stock updated successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Get low stock products (admin only)
router.get('/admin/low-stock',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response<ApiResponse<Product[]>>) => {
    const result = await ProductService.getLowStockProducts()
    
    res.json({
      success: true,
      data: result,
      message: 'Low stock products retrieved successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Bulk operations (admin only)
router.post('/bulk/update-status',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { productIds, isActive } = req.body
    
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid product IDs',
        message: 'Please provide an array of product IDs',
        timestamp: new Date().toISOString()
      })
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: 'isActive must be a boolean value',
        timestamp: new Date().toISOString()
      })
    }

    // Update multiple products
    const updatePromises = productIds.map(id => 
      ProductService.updateProduct(id, { isActive }, req.userId!)
    )

    await Promise.all(updatePromises)
    
    res.json({
      success: true,
      message: `${productIds.length} products updated successfully`,
      timestamp: new Date().toISOString()
    })
  })
)

// Export products (admin only)
router.get('/admin/export',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const format = req.query.format as string || 'json'
    const includeInactive = req.query.includeInactive === 'true'
    
    const filters: ProductFilter = {
      isActive: includeInactive ? undefined : true
    }

    const result = await ProductService.getProducts(filters, { page: 1, limit: 10000 })
    
    if (format === 'csv') {
      // Set CSV headers
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', 'attachment; filename=products.csv')
      
      // Convert to CSV format
      const csvHeader = 'ID,Name,Code,Category,Price,Currency,Stock,Unit,Active,Created\n'
      const csvRows = result.data.map(product => 
        `${product.id},${product.name},${product.code},${product.category},${product.price},${product.currency},${product.stockQuantity},${product.unit},${product.isActive},${product.createdAt}`
      ).join('\n')
      
      res.send(csvHeader + csvRows)
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', 'attachment; filename=products.json')
      
      res.json({
        success: true,
        data: result.data,
        exportDate: new Date().toISOString(),
        totalCount: result.pagination.total
      })
    }
  })
)

export default router