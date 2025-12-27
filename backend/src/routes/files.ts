import { Router, Request, Response } from 'express'
import multer from 'multer'
import { CloudinaryService } from '../services/cloudinaryService'
import { DocumentService } from '../services/documentService'
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth'
import { validateFileUpload } from '../middleware/validation'
import { asyncHandler } from '../middleware/errorHandler'
import { ApiResponse, FileUploadResult, MultipleFileUploadResult } from '../types/index'

const router = Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      // Enhanced image format support - matching validation.ts
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
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      const supportedFormats = allowedMimeTypes
        .filter(type => type.startsWith('image/'))
        .map(type => type.replace('image/', '').toUpperCase())
        .join(', ')
      
      cb(new Error(`File type ${file.mimetype} is not allowed. Supported image formats: ${supportedFormats}`))
    }
  }
})

// Single file upload (public with auth)
router.post('/upload',
  authenticateToken,
  upload.single('file'),
  validateFileUpload,
  asyncHandler(async (req: Request, res: Response<ApiResponse<FileUploadResult>>) => {
    const file = req.file!
    const folder = req.body.folder || 'general'
    
    const result = await CloudinaryService.uploadFile(file, folder)
    
    res.json({
      success: true,
      data: result,
      message: 'File uploaded successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Multiple files upload (admin only)
router.post('/upload/multiple',
  authenticateToken,
  requireAdmin,
  upload.array('files', 10),
  validateFileUpload,
  asyncHandler(async (req: Request, res: Response<ApiResponse<MultipleFileUploadResult>>) => {
    const files = req.files as Express.Multer.File[]
    const folder = req.body.folder || 'general'
    
    const result = await CloudinaryService.uploadMultipleFiles(files, folder)
    
    res.json({
      success: true,
      data: result,
      message: `${result.files.length} files uploaded successfully`,
      timestamp: new Date().toISOString()
    })
  })
)

// Product image upload (admin only)
router.post('/upload/product-images/:productId',
  authenticateToken,
  requireAdmin,
  upload.array('images', 5),
  validateFileUpload,
  asyncHandler(async (req: Request, res: Response<ApiResponse<MultipleFileUploadResult>>) => {
    const files = req.files as Express.Multer.File[]
    const productId = req.params.productId
    
    const result = await CloudinaryService.uploadMultipleFiles(files, `products/${productId}`)
    
    res.json({
      success: true,
      data: result,
      message: `Product images uploaded successfully`,
      timestamp: new Date().toISOString()
    })
  })
)

// Category image upload (admin only)
router.post('/upload/category-image/:categoryId',
  authenticateToken,
  requireAdmin,
  upload.single('image'),
  validateFileUpload,
  asyncHandler(async (req: Request, res: Response<ApiResponse<FileUploadResult>>) => {
    const file = req.file!
    const categoryId = req.params.categoryId
    
    const result = await CloudinaryService.uploadFile(file, `categories/${categoryId}`)
    
    res.json({
      success: true,
      data: result,
      message: 'Category image uploaded successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Document upload (admin only)
router.post('/upload/document',
  authenticateToken,
  requireAdmin,
  upload.single('document'),
  validateFileUpload,
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const file = req.file!
    const { name, type, productId, categoryId, isPublic = false } = req.body
    
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Document name and type are required',
        timestamp: new Date().toISOString()
      })
    }

    // Upload to cloudinary
    const uploadResult = await CloudinaryService.uploadFile(file, 'documents')
    
    // Save document record
    const document = await DocumentService.createDocument({
      name,
      type,
      fileUrl: uploadResult.url,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      productId: productId || undefined,
      categoryId: categoryId || undefined,
      isPublic: isPublic === 'true',
      uploadedBy: req.userId!
    })
    
    res.json({
      success: true,
      data: document,
      message: 'Document uploaded successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Get user's uploaded files (authenticated user)
router.get('/my-uploads',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    
    const documents = await DocumentService.getUserDocuments(req.userId!, { page, limit })
    
    res.json({
      success: true,
      data: documents,
      message: 'User documents retrieved successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Get all documents (admin only)
router.get('/documents',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const type = req.query.type as string
    const productId = req.query.productId as string
    
    const filters = {
      ...(type && { type }),
      ...(productId && { productId })
    }
    
    const documents = await DocumentService.getAllDocuments(filters, { page, limit })
    
    res.json({
      success: true,
      data: documents,
      message: 'Documents retrieved successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Get public documents
router.get('/public-documents',
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const type = req.query.type as string
    const productId = req.query.productId as string
    
    const filters = {
      isPublic: true,
      ...(type && { type }),
      ...(productId && { productId })
    }
    
    const documents = await DocumentService.getAllDocuments(filters, { page, limit })
    
    res.json({
      success: true,
      data: documents,
      message: 'Public documents retrieved successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Delete file (admin only)
router.delete('/:fileId',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const fileId = req.params.fileId
    
    // Get document details
    const document = await DocumentService.getDocumentById(fileId)
    
    // Delete from cloudinary
    await CloudinaryService.deleteFile(document.fileUrl)
    
    // Delete document record
    await DocumentService.deleteDocument(fileId)
    
    res.json({
      success: true,
      message: 'File deleted successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Update document metadata (admin only)
router.patch('/:fileId',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const fileId = req.params.fileId
    const { name, type, isPublic, productId, categoryId } = req.body
    
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type
    if (isPublic !== undefined) updateData.isPublic = isPublic
    if (productId !== undefined) updateData.productId = productId
    if (categoryId !== undefined) updateData.categoryId = categoryId
    
    const document = await DocumentService.updateDocument(fileId, updateData)
    
    res.json({
      success: true,
      data: document,
      message: 'Document updated successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Get file download URL (public for public files, authenticated for private)
router.get('/download/:fileId',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const fileId = req.params.fileId
    
    const document = await DocumentService.getDocumentById(fileId)
    
    // Check permissions
    if (!document.isPublic && !req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'This file requires authentication to access',
        timestamp: new Date().toISOString()
      })
    }
    
    // Generate download URL (could be signed URL for security)
    const downloadUrl = await CloudinaryService.getDownloadUrl(document.fileUrl)
    
    res.json({
      success: true,
      data: {
        downloadUrl,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType
      },
      message: 'Download URL generated successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Image optimization/resize endpoint
router.post('/optimize-image',
  authenticateToken,
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response<ApiResponse<FileUploadResult>>) => {
    const file = req.file!
    const { width, height, quality = 80 } = req.body
    
    if (!file.mimetype.startsWith('image/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type',
        message: 'Only image files can be optimized',
        timestamp: new Date().toISOString()
      })
    }

    const result = await CloudinaryService.uploadOptimizedImage(file, {
      width: width ? parseInt(width) : undefined,
      height: height ? parseInt(height) : undefined,
      quality: parseInt(quality),
      folder: 'optimized'
    })
    
    res.json({
      success: true,
      data: result,
      message: 'Image optimized and uploaded successfully',
      timestamp: new Date().toISOString()
    })
  })
)

export default router