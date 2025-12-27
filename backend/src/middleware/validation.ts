import { Request, Response, NextFunction } from 'express'
import { body, param, query, validationResult, ValidationChain } from 'express-validator'
import { ValidationError } from './errorHandler.js'
import { ApiResponse } from '../types/index.js'

// Middleware to handle validation results
export const handleValidationErrors = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.type === 'field' ? (error as any).path : 'unknown',
      message: error.msg,
      value: error.type === 'field' ? (error as any).value : undefined
    }))

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: errorMessages.map(err => `${err.field}: ${err.message}`).join(', '),
      timestamp: new Date().toISOString()
    })
    return
  }
  
  next()
}

// User validation rules
export const validateRegister: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
]

export const validateLogin: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
]

// Product validation rules
export const validateProduct: ValidationChain[] = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Product name must be between 2 and 200 characters'),
  body('code')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Product code is required and must be less than 50 characters')
    .matches(/^[A-Z0-9-_]+$/)
    .withMessage('Product code can only contain uppercase letters, numbers, hyphens, and underscores'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('subCategory')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Sub-category must be less than 100 characters'),
  body('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .custom(value => {
      if (value <= 0) {
        throw new Error('Price must be greater than 0')
      }
      return true
    }),
  body('currency')
    .trim()
    .isIn(['TRY', 'USD', 'EUR'])
    .withMessage('Currency must be TRY, USD, or EUR'),
  body('stockQuantity')
    .isInt({ min: 0 })
    .withMessage('Stock quantity must be a non-negative integer'),
  body('minStockLevel')
    .isInt({ min: 0 })
    .withMessage('Minimum stock level must be a non-negative integer'),
  body('unit')
    .trim()
    .notEmpty()
    .withMessage('Unit is required')
    .isLength({ max: 20 })
    .withMessage('Unit must be less than 20 characters'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('images.*')
    .optional()
    .custom((value, { req }) => {
      // Skip validation for empty values
      if (!value || value === '' || value === null || value === undefined) {
        return true
      }
      
      // Must be a string
      if (typeof value !== 'string') {
        throw new Error('Image URL must be a string')
      }
      
      // Enhanced validation for development environment
      const isDevelopment = process.env.NODE_ENV === 'development'
      const forceMockUploads = process.env.FORCE_MOCK_UPLOADS === 'true'
      
      // In development with mock uploads, be more permissive
      if (isDevelopment || forceMockUploads) {
        // Mock URLs for development
        if (value.startsWith('/mock-uploads/')) {
          return true
        }
        
        // Temp mock URLs
        if (value.startsWith('/temp/') || value.startsWith('temp/')) {
          return true
        }
        
        // Local uploads
        if (value.startsWith('/uploads/') || value.startsWith('./uploads/') || value.startsWith('uploads/')) {
          return true
        }
        
        // Relative paths
        if (value.startsWith('./') || value.startsWith('../')) {
          return true
        }
        
        // Static assets
        if (value.startsWith('/static/') || value.startsWith('/assets/')) {
          return true
        }
      }
      
      // Cloudinary URLs
      if (value.includes('cloudinary.com') || value.includes('res.cloudinary.com')) {
        return true
      }
      
      // Standard HTTP/HTTPS URLs
      if (value.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|avif|heic)$/i)) {
        return true
      }
      
      // Data URLs (base64 images)
      if (value.startsWith('data:image/')) {
        return true
      }
      
      // For development, also accept simple file names (will be converted to mock URLs)
      if (isDevelopment && value.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|avif|heic)$/i)) {
        return true
      }
      
      throw new Error(`Invalid image URL format: ${value.substring(0, 50)}...`)
    })
    .withMessage('Each image must be a valid URL, mock path, or development file path'),
  body('technicalSpecs')
    .optional()
    .isArray()
    .withMessage('Technical specifications must be an array'),
  body('technicalSpecs.*.name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Specification name is required and must be less than 100 characters'),
  body('technicalSpecs.*.value')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Specification value is required and must be less than 200 characters'),
  body('technicalSpecs.*.unit')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Specification unit must be less than 20 characters'),
  body('applications')
    .optional()
    .isArray()
    .withMessage('Applications must be an array'),
  body('applications.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Each application must be between 1 and 200 characters'),
  body('certifications')
    .optional()
    .isArray()
    .withMessage('Certifications must be an array'),
  body('certifications.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Each certification must be between 1 and 100 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
]

export const validateProductUpdate: ValidationChain[] = [
  param('id')
    .custom(value => {
      // Check if it's UUID format
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      // Check if it's CUID format (c + 24 characters)
      const cuidPattern = /^c[a-z0-9]{24}$/i
      
      if (uuidPattern.test(value) || cuidPattern.test(value)) {
        return true
      }
      throw new Error('Valid product ID (UUID or CUID) is required')
    }),
  ...validateProduct.map(rule => rule.optional())
]

// Category validation rules
export const validateCategory: ValidationChain[] = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category name must be between 2 and 100 characters'),
  body('slug')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Category slug must be between 2 and 100 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('parentId')
    .optional()
    .isUUID()
    .withMessage('Parent ID must be a valid UUID'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('order')
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer')
]

// Common parameter validations
export const validateId: ValidationChain[] = [
  param('id')
    .custom(value => {
      // Check if it's UUID format
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      // Check if it's CUID format (c + 24 characters)
      const cuidPattern = /^c[a-z0-9]{24}$/i
      
      if (uuidPattern.test(value) || cuidPattern.test(value)) {
        return true
      }
      throw new Error('Valid ID (UUID or CUID) is required')
    })
]

// Alternative validation for params that need CUID specifically
export const validateParentId: ValidationChain[] = [
  param('parentId')
    .custom(value => {
      // Check if it's UUID format
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      // Check if it's CUID format (c + 24 characters)
      const cuidPattern = /^c[a-z0-9]{24}$/i
      
      if (uuidPattern.test(value) || cuidPattern.test(value)) {
        return true
      }
      throw new Error('Valid parent ID (UUID or CUID) is required')
    })
]

export const validatePagination: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Limit must be between 1 and 10000'),
  query('sortBy')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Sort field must be specified'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
]

// File upload validation
export const validateFileUpload = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  if (!req.file && !req.files) {
    res.status(400).json({
      success: false,
      error: 'File required',
      message: 'Please upload a file',
      timestamp: new Date().toISOString()
    })
    return
  }

  const allowedMimeTypes = [
    // Enhanced image format support
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',  // SVG support added
    'image/bmp',
    'image/tiff',
    'image/avif',     // Modern format
    'image/heic',     // iOS format
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]

  const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file]
  
  for (const file of files) {
    if (file && !allowedMimeTypes.includes(file.mimetype)) {
      res.status(400).json({
        success: false,
        error: 'Invalid file type',
        message: `File type ${file.mimetype} is not allowed`,
        timestamp: new Date().toISOString()
      })
      return
    }
  }

  next()
}