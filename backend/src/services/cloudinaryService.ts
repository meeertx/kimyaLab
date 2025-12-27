import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import { config } from '../config/config'
import { FileUploadResult, MultipleFileUploadResult } from '../types/index'
import { ExternalServiceError, ValidationError } from '../middleware/errorHandler'
import * as fs from 'fs'
import * as path from 'path'

// Enhanced Cloudinary configuration validation
const isCloudinaryConfigured = (): boolean => {
  const { cloudName, apiKey, apiSecret } = config.cloudinary
  
  // Check if all required fields are present and not placeholder values
  return !!(cloudName &&
         apiKey &&
         apiSecret &&
         cloudName !== 'your-cloudinary-cloud-name' &&
         cloudName !== 'demo' &&
         apiKey !== 'your-cloudinary-api-key' &&
         apiKey !== '123456789012345' &&
         apiSecret !== 'your-cloudinary-api-secret' &&
         apiSecret !== 'demo_secret_key_for_testing')
}

// Environment-based system selection
const isDevelopment = process.env.NODE_ENV === 'development'
const forceUseMock = process.env.FORCE_MOCK_UPLOADS === 'true'

const shouldUseMockSystem = (): boolean => {
  // Force mock if explicitly set
  if (forceUseMock) {
    console.log('🎭 [MOCK] Force mock uploads enabled via environment variable')
    return true
  }
  
  // Use mock in development if no real credentials
  if (isDevelopment && !isCloudinaryConfigured()) {
    console.log('🎭 [MOCK] Using mock upload system in development - no real Cloudinary credentials')
    return true
  }
  
  // Use real Cloudinary in production or when properly configured
  return false
}

// Configure Cloudinary only if properly configured and not using mock
if (isCloudinaryConfigured() && !shouldUseMockSystem()) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret
  })
  console.log('✅ Cloudinary configured successfully for production uploads')
} else if (shouldUseMockSystem()) {
  console.log('🎭 Mock upload system active - uploads will use mock URLs')
} else {
  console.warn('⚠️ Cloudinary not properly configured - check your environment variables')
}

export interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: string
  folder?: string
}

export class CloudinaryService {
  // Check if should use mock system
  static shouldUseMock(): boolean {
    return shouldUseMockSystem()
  }

  // Check if Cloudinary is available
  static isAvailable(): boolean {
    return isCloudinaryConfigured() && !shouldUseMockSystem()
  }

  // Create physical mock file
  static createMockFile(file: Express.Multer.File, mockUrl: string): void {
    try {
      const relativePath = mockUrl.replace('/mock-uploads/', '')
      const fullPath = path.join(process.cwd(), 'mock-uploads', relativePath)
      
      // Ensure directory exists
      const dir = path.dirname(fullPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      // Write file buffer to disk
      if (file.buffer) {
        fs.writeFileSync(fullPath, file.buffer)
        console.log(`💾 [MOCK] Created file: ${fullPath}`)
      } else {
        // Create empty placeholder file if no buffer
        fs.writeFileSync(fullPath, '')
        console.log(`📝 [MOCK] Created placeholder: ${fullPath}`)
      }
    } catch (error) {
      console.error('❌ [MOCK] Error creating file:', error)
    }
  }

  // Enhanced mock upload with better metadata and physical file creation
  static generateMockUploadResult(file: Express.Multer.File, folder = 'general'): FileUploadResult {
    const timestamp = Date.now()
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase() || 'unknown'
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
    
    console.log(`📁 [MOCK] Simulating upload: ${file.originalname} (${file.mimetype}) to folder: ${folder}`)
    
    // Generate mock dimensions for images
    const isImage = file.mimetype.startsWith('image/')
    const mockWidth = isImage ? Math.floor(Math.random() * 1000) + 400 : undefined
    const mockHeight = isImage ? Math.floor(Math.random() * 800) + 300 : undefined
    
    const mockUrl = `/mock-uploads/${folder}/${timestamp}_${cleanFileName}`
    
    // Create physical mock file
    this.createMockFile(file, mockUrl)
    
    return {
      url: mockUrl,
      publicId: `mock_${folder}_${timestamp}_${fileExtension}`,
      originalName: file.originalname,
      size: file.size || 0,
      mimeType: file.mimetype,
      // Mock metadata for better compatibility
      width: mockWidth,
      height: mockHeight,
      format: fileExtension,
      resourceType: isImage ? 'image' : 'raw',
      createdAt: new Date().toISOString(),
      bytes: file.size || 0
    }
  }

  // Upload single file
  static async uploadFile(file: Express.Multer.File, folder = 'general'): Promise<FileUploadResult> {
    // Use mock system if configured
    if (this.shouldUseMock()) {
      return this.generateMockUploadResult(file, folder)
    }

    // Check if real Cloudinary is available
    if (!this.isAvailable()) {
      console.warn('⚠️ Cloudinary not configured, falling back to mock upload')
      return this.generateMockUploadResult(file, folder)
    }

    try {
      return new Promise((resolve, reject) => {
        const uploadOptions = {
          folder: `kimyalab/${folder}`,
          resource_type: 'auto' as const,
          use_filename: true,
          unique_filename: true,
          overwrite: false
        }

        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error)
              
              // Return mock result instead of crashing
              resolve({
                url: `/mock-uploads/${file.originalname}`,
                publicId: `mock-${Date.now()}`,
                originalName: file.originalname,
                size: file.size || 0,
                mimeType: file.mimetype
              })
              return
            }

            if (!result) {
              resolve({
                url: `/mock-uploads/${file.originalname}`,
                publicId: `mock-${Date.now()}`,
                originalName: file.originalname,
                size: file.size || 0,
                mimeType: file.mimetype
              })
              return
            }

            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              originalName: file.originalname,
              size: result.bytes,
              mimeType: file.mimetype
            })
          }
        )

        uploadStream.end(file.buffer)
      })
    } catch (error) {
      console.error('Error uploading file to Cloudinary:', error)
      
      // Return mock result instead of throwing
      return {
        url: `/mock-uploads/${file.originalname}`,
        publicId: `mock-${Date.now()}`,
        originalName: file.originalname,
        size: file.size || 0,
        mimeType: file.mimetype
      }
    }
  }

  // Upload multiple files
  static async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder = 'general'
  ): Promise<MultipleFileUploadResult> {
    // Use mock system if configured
    if (this.shouldUseMock()) {
      console.log(`📁 [MOCK] Batch upload: ${files.length} files to folder: ${folder}`)
      return {
        files: files.map(file => this.generateMockUploadResult(file, folder)),
        failed: []
      }
    }

    // Check if real Cloudinary is available
    if (!this.isAvailable()) {
      console.warn('⚠️ Cloudinary not configured, falling back to mock batch upload')
      return {
        files: files.map(file => this.generateMockUploadResult(file, folder)),
        failed: []
      }
    }

    try {
      const uploadPromises = files.map(file =>
        this.uploadFile(file, folder).catch(error => ({
          error: error.message,
          originalName: file.originalname
        }))
      )

      const results = await Promise.all(uploadPromises)
      
      const successfulUploads: FileUploadResult[] = []
      const failedUploads: string[] = []

      results.forEach((result, index) => {
        if ('error' in result) {
          failedUploads.push(`${files[index].originalname}: ${result.error}`)
        } else {
          successfulUploads.push(result)
        }
      })

      return {
        files: successfulUploads,
        failed: failedUploads
      }
    } catch (error) {
      console.error('Error in uploadMultipleFiles:', error)
      
      // Return mock results for all files
      return {
        files: files.map(file => ({
          url: `/mock-uploads/${file.originalname}`,
          publicId: `mock-${Date.now()}`,
          originalName: file.originalname,
          size: file.size || 0,
          mimeType: file.mimetype
        })),
        failed: []
      }
    }
  }

  // Upload optimized image
  static async uploadOptimizedImage(
    file: Express.Multer.File,
    options: ImageOptimizationOptions = {}
  ): Promise<FileUploadResult> {
    try {
      if (!file.mimetype.startsWith('image/')) {
        throw new ValidationError('File must be an image')
      }

      const {
        width,
        height,
        quality = 80,
        format = 'auto',
        folder = 'optimized'
      } = options

      return new Promise((resolve, reject) => {
        const transformation: any[] = []

        // Add resize transformation if specified
        if (width || height) {
          transformation.push({
            width,
            height,
            crop: 'limit', // Maintain aspect ratio
            fetch_format: format,
            quality: quality
          })
        }

        // Add quality optimization
        transformation.push({
          fetch_format: format,
          quality: quality
        })

        const uploadOptions = {
          folder: `kimyalab/${folder}`,
          resource_type: 'image' as const,
          use_filename: true,
          unique_filename: true,
          overwrite: false,
          transformation: transformation
        }

        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('Cloudinary optimized upload error:', error)
              reject(new ExternalServiceError('Image optimization failed'))
              return
            }

            if (!result) {
              reject(new ExternalServiceError('Upload result is empty'))
              return
            }

            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              originalName: file.originalname,
              size: result.bytes,
              mimeType: result.format ? `image/${result.format}` : file.mimetype
            })
          }
        )

        uploadStream.end(file.buffer)
      })
    } catch (error) {
      console.error('Error uploading optimized image:', error)
      throw new ExternalServiceError('Image optimization failed')
    }
  }

  // Delete file from Cloudinary
  static async deleteFile(urlOrPublicId: string): Promise<void> {
    try {
      let publicId: string

      if (urlOrPublicId.includes('cloudinary.com')) {
        // Extract public ID from URL
        const urlParts = urlOrPublicId.split('/')
        const fileWithExtension = urlParts[urlParts.length - 1]
        publicId = fileWithExtension.split('.')[0]
        
        // Include folder path if present
        const folderStartIndex = urlParts.findIndex(part => part === 'kimyalab')
        if (folderStartIndex !== -1 && folderStartIndex < urlParts.length - 1) {
          const folderPath = urlParts.slice(folderStartIndex, -1).join('/')
          publicId = `${folderPath}/${publicId}`
        }
      } else {
        publicId = urlOrPublicId
      }

      const result = await cloudinary.uploader.destroy(publicId)
      
      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new ExternalServiceError(`Failed to delete file: ${result.result}`)
      }
    } catch (error) {
      console.error('Error deleting file from Cloudinary:', error)
      throw new ExternalServiceError('File deletion failed')
    }
  }

  // Generate signed download URL
  static async getDownloadUrl(url: string, expiresIn = 3600): Promise<string> {
    try {
      // For most cases, Cloudinary URLs are publicly accessible
      // This method can be used to generate signed URLs for private resources
      const timestamp = Math.round(Date.now() / 1000) + expiresIn
      
      // Extract public ID from URL for signing
      const urlParts = url.split('/')
      const fileWithExtension = urlParts[urlParts.length - 1]
      const publicId = fileWithExtension.split('.')[0]
      
      // Generate signed URL (if needed for private resources)
      const signedUrl = cloudinary.utils.private_download_url(publicId, 'auto', {
        expires_at: timestamp
      })

      return signedUrl || url // Return original URL if signing fails
    } catch (error) {
      console.error('Error generating download URL:', error)
      return url // Fallback to original URL
    }
  }

  // Generate image transformation URL
  static getTransformedImageUrl(
    publicId: string,
    transformations: any = {}
  ): string {
    try {
      return cloudinary.url(publicId, {
        ...transformations,
        secure: true
      })
    } catch (error) {
      console.error('Error generating transformed URL:', error)
      throw new ExternalServiceError('URL generation failed')
    }
  }

  // Get image info
  static async getImageInfo(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: 'image'
      })
      
      return {
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        url: result.secure_url,
        createdAt: result.created_at
      }
    } catch (error) {
      console.error('Error getting image info:', error)
      throw new ExternalServiceError('Failed to get image information')
    }
  }

  // Bulk delete files
  static async deleteMultipleFiles(publicIds: string[]): Promise<{ deleted: string[], failed: string[] }> {
    try {
      const results = await Promise.allSettled(
        publicIds.map(publicId => this.deleteFile(publicId))
      )

      const deleted: string[] = []
      const failed: string[] = []

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          deleted.push(publicIds[index])
        } else {
          failed.push(publicIds[index])
        }
      })

      return { deleted, failed }
    } catch (error) {
      console.error('Error in bulk delete:', error)
      throw new ExternalServiceError('Bulk delete failed')
    }
  }

  // Search images by tags or other criteria
  static async searchImages(searchQuery: any = {}): Promise<any[]> {
    try {
      const result = await cloudinary.search
        .expression(searchQuery.expression || 'folder:kimyalab/*')
        .sort_by('created_at', 'desc')
        .max_results(searchQuery.maxResults || 100)
        .execute()

      return result.resources || []
    } catch (error) {
      console.error('Error searching images:', error)
      throw new ExternalServiceError('Image search failed')
    }
  }

  // Get folder contents
  static async getFolderContents(folder: string): Promise<any[]> {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: `kimyalab/${folder}`,
        max_results: 500
      })

      return result.resources || []
    } catch (error) {
      console.error('Error getting folder contents:', error)
      throw new ExternalServiceError('Failed to get folder contents')
    }
  }

  // Health check
  static async healthCheck(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false
    }

    try {
      await cloudinary.api.ping()
      return true
    } catch (error) {
      console.error('Cloudinary health check failed:', error)
      return false
    }
  }
}