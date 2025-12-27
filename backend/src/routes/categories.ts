import { Router, Request, Response } from 'express'
import { CategoryService } from '../services/categoryService'
import {
  validateCategory,
  validateId,
  validateParentId,
  handleValidationErrors
} from '../middleware/validation'
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { ApiResponse, Category } from '../types/index'

const router = Router()

// Get all categories (public, hierarchical)
router.get('/',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response<ApiResponse<Category[]>>) => {
    const includeInactive = req.user?.role === 'ADMIN'
    const result = await CategoryService.getAllCategories(includeInactive)
    
    res.json({
      success: true,
      data: result,
      message: 'Categories retrieved successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Get category tree (hierarchical structure)
router.get('/tree',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const includeInactive = req.user?.role === 'ADMIN'
    const result = await CategoryService.getCategoryTree(includeInactive)
    
    res.json({
      success: true,
      data: result,
      message: 'Category tree retrieved successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Get single category by ID or slug
router.get('/:identifier',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response<ApiResponse<Category>>) => {
    const identifier = req.params.identifier
    const includeInactive = req.user?.role === 'ADMIN'
    
    // Check if identifier is UUID (ID) or slug
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier)
    
    let result: Category
    if (isId) {
      result = await CategoryService.getCategoryById(identifier, includeInactive)
    } else {
      result = await CategoryService.getCategoryBySlug(identifier, includeInactive)
    }
    
    res.json({
      success: true,
      data: result,
      message: 'Category retrieved successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Create new category (admin only)
router.post('/',
  authenticateToken,
  requireAdmin,
  validateCategory,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response<ApiResponse<Category>>) => {
    const result = await CategoryService.createCategory(req.body)
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Category created successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Update category (admin only)
router.put('/:id',
  authenticateToken,
  requireAdmin,
  validateId,
  validateCategory,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response<ApiResponse<Category>>) => {
    const result = await CategoryService.updateCategory(req.params.id, req.body)
    
    res.json({
      success: true,
      data: result,
      message: 'Category updated successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Delete category (admin only)
router.delete('/:id',
  authenticateToken,
  requireAdmin,
  validateId,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    await CategoryService.deleteCategory(req.params.id)
    
    res.json({
      success: true,
      message: 'Category deleted successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Get subcategories by parent ID or slug
router.get('/parent/:parentIdentifier/subcategories',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response<ApiResponse<Category[]>>) => {
    const parentIdentifier = req.params.parentIdentifier
    const includeInactive = req.user?.role === 'ADMIN'
    
    try {
      // Check if identifier is UUID (ID) or slug
      const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parentIdentifier)
      
      let parentCategory: Category
      if (isId) {
        parentCategory = await CategoryService.getCategoryById(parentIdentifier, includeInactive)
      } else {
        parentCategory = await CategoryService.getCategoryBySlug(parentIdentifier, includeInactive)
      }
      
      // Get subcategories using parent ID
      const subcategories = await CategoryService.getSubcategoriesByParentId(parentCategory.id, includeInactive)
      
      res.json({
        success: true,
        data: subcategories,
        message: 'Subcategories retrieved successfully',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      res.status(404).json({
        success: false,
        error: 'Parent category not found',
        message: `Category with identifier '${parentIdentifier}' not found`,
        timestamp: new Date().toISOString()
      })
    }
  })
)

// Reorder categories (admin only)
router.patch('/reorder',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { categoryOrders } = req.body
    
    if (!Array.isArray(categoryOrders)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category orders',
        message: 'Category orders must be an array of {id, order} objects',
        timestamp: new Date().toISOString()
      })
    }

    await CategoryService.reorderCategories(categoryOrders)
    
    res.json({
      success: true,
      message: 'Categories reordered successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Get category with products count (admin)
router.get('/:id/stats',
  authenticateToken,
  requireAdmin,
  validateId,
  handleValidationErrors,
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const stats = await CategoryService.getCategoryStats(req.params.id)
    
    res.json({
      success: true,
      data: stats,
      message: 'Category statistics retrieved successfully',
      timestamp: new Date().toISOString()
    })
  })
)

export default router