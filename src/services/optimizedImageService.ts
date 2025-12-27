import { apiClient } from './api/apiClient'

export interface UploadProgress {
  progress: number
  isUploading: boolean
  error?: string
  downloadURL?: string
  fileName?: string
  fileSize?: number
}

export interface BatchUploadProgress {
  totalFiles: number
  completedFiles: number
  overallProgress: number
  fileProgresses: Map<string, UploadProgress>
  errors: Array<{ fileName: string; error: string }>
}

export class OptimizedImageService {
  // Upload single image with progress tracking
  static async uploadImage(
    file: File, 
    path: string,
    onProgress?: (progress: UploadProgress) => void,
    options?: {
      resize?: boolean
      compress?: boolean
      maxWidth?: number
      maxHeight?: number
      quality?: number
    }
  ): Promise<string> {
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Sadece resim dosyaları yüklenebilir')
      }

      const maxSize = 10 * 1024 * 1024 // 10MB limit
      if (file.size > maxSize) {
        throw new Error('Dosya boyutu 10MB\'dan küçük olmalıdır')
      }

      onProgress?.({
        progress: 10,
        isUploading: true,
        fileName: file.name,
        fileSize: file.size
      })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', path)

      // Use optimization endpoint if needed
      const endpoint = options?.resize || options?.compress || file.size > 2 * 1024 * 1024
        ? '/api/files/optimize-image'
        : '/api/files/upload'

      if (endpoint === '/api/files/optimize-image' && options) {
        if (options.maxWidth) formData.append('width', options.maxWidth.toString())
        if (options.maxHeight) formData.append('height', options.maxHeight.toString())
        if (options.quality) formData.append('quality', options.quality.toString())
      }

      // Use direct fetch for file uploads with progress tracking
      const token = localStorage.getItem('accessToken')
      const headers: HeadersInit = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`http://localhost:5001${endpoint}`, {
        method: 'POST',
        headers,
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Upload failed')
      }

      onProgress?.({
        progress: 100,
        isUploading: false,
        downloadURL: result.data.url,
        fileName: file.name,
        fileSize: file.size
      })

      return result.data.url
    } catch (error) {
      console.error('Error uploading image:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      
      onProgress?.({
        progress: 0,
        isUploading: false,
        error: errorMessage,
        fileName: file.name,
        fileSize: file.size
      })
      
      throw error
    }
  }

  // Upload multiple product images
  static async uploadProductImages(
    files: FileList | File[], 
    productId: string,
    onBatchProgress?: (progress: BatchUploadProgress) => void
  ): Promise<string[]> {
    try {
      const fileArray = Array.from(files)
      const totalFiles = fileArray.length
      
      if (totalFiles === 0) {
        throw new Error('No files selected')
      }

      if (totalFiles > 5) {
        throw new Error('Maximum 5 images allowed per product')
      }

      const batchProgress: BatchUploadProgress = {
        totalFiles,
        completedFiles: 0,
        overallProgress: 0,
        fileProgresses: new Map(),
        errors: []
      }

      const formData = new FormData()
      fileArray.forEach(file => {
        formData.append('images', file)
      })

      // Use direct fetch for file uploads
      const token = localStorage.getItem('accessToken')
      const headers: HeadersInit = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`http://localhost:5001/api/files/upload/product-images/${productId}`, {
        method: 'POST',
        headers,
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Batch upload failed')
      }

      batchProgress.overallProgress = 100
      batchProgress.completedFiles = totalFiles
      onBatchProgress?.(batchProgress)

      return result.data.files.map((file: any) => file.url)
    } catch (error) {
      console.error('Error uploading product images:', error)
      throw error
    }
  }

  // Parallel upload multiple images with batch progress
  static async uploadMultipleImages(
    files: FileList | File[], 
    path: string,
    onBatchProgress?: (progress: BatchUploadProgress) => void,
    options?: {
      resize?: boolean
      compress?: boolean
      maxWidth?: number
      maxHeight?: number
      quality?: number
      concurrency?: number
    }
  ): Promise<string[]> {
    try {
      const fileArray = Array.from(files)
      const totalFiles = fileArray.length
      
      if (totalFiles === 0) {
        throw new Error('No files selected')
      }

      if (totalFiles > 10) {
        throw new Error('Maximum 10 files allowed at once')
      }

      const batchProgress: BatchUploadProgress = {
        totalFiles,
        completedFiles: 0,
        overallProgress: 0,
        fileProgresses: new Map(),
        errors: []
      }

      const formData = new FormData()
      fileArray.forEach(file => {
        formData.append('files', file)
      })
      formData.append('folder', path)

      // Use direct fetch for file uploads
      const token = localStorage.getItem('accessToken')
      const headers: HeadersInit = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch('http://localhost:5001/api/files/upload/multiple', {
        method: 'POST',
        headers,
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Multiple upload failed')
      }

      batchProgress.overallProgress = 100
      batchProgress.completedFiles = totalFiles
      onBatchProgress?.(batchProgress)

      return result.data.files.map((file: any) => file.url)
    } catch (error) {
      console.error('Error uploading multiple images:', error)
      throw error
    }
  }

  // Delete image (not implemented in backend yet - placeholder)
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Would need backend endpoint for image deletion
      console.log('Delete image:', imageUrl)
      // For now, just log - would need /api/files/:fileId DELETE endpoint
    } catch (error) {
      console.error('Error deleting image:', error)
      throw error
    }
  }

  // Batch delete images (placeholder)
  static async deleteMultipleImages(imageUrls: string[]): Promise<void> {
    try {
      // Would need backend endpoint for batch deletion
      console.log('Delete images:', imageUrls)
      await Promise.all(imageUrls.map(url => this.deleteImage(url)))
    } catch (error) {
      console.error('Error deleting multiple images:', error)
      throw error
    }
  }

  // Validate image file with enhanced checks
  static validateImage(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Sadece JPEG, PNG ve WebP formatları desteklenir'
      }
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Dosya boyutu 10MB\'dan küçük olmalıdır'
      }
    }

    if (file.size === 0) {
      return {
        isValid: false,
        error: 'Dosya boş görünüyor'
      }
    }

    return { isValid: true }
  }

  // Local image processing (client-side)
  static resizeImageLocal(
    file: File, 
    maxWidth: number = 1024, 
    maxHeight: number = 1024, 
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(resizedFile)
            } else {
              reject(new Error('Canvas to blob conversion failed'))
            }
          },
          file.type,
          quality
        )
      }

      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }
}

// Helper functions
export const getImagePath = (category: string, productId?: string) => {
  if (productId) {
    return `products/${category}/${productId}`
  }
  return `products/${category}`
}

export const getCategoryImagePath = (categorySlug: string) => {
  return `categories/${categorySlug}`
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/')
}

// Status indicator
console.log('🚀 OptimizedImageService: Using PostgreSQL Backend with Cloudinary (Firebase removed)')