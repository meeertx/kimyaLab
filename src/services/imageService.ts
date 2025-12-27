// PostgreSQL Backend Image Service (Simplified)
export interface UploadProgress {
  progress: number
  isUploading: boolean
  error?: string
  downloadURL?: string
}

export class ImageService {
  // Upload single image (delegated to OptimizedImageService)
  static async uploadImage(
    file: File, 
    path: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Sadece resim dosyaları yüklenebilir')
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('Dosya boyutu 5MB\'dan küçük olmalıdır')
      }

      // Use direct backend API call
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', path)

      const token = localStorage.getItem('accessToken')
      const headers: HeadersInit = {}
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      onProgress?.({ progress: 10, isUploading: true })

      const response = await fetch('http://localhost:5001/api/files/upload', {
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
        downloadURL: result.data.url
      })

      return result.data.url
    } catch (error) {
      console.error('Error uploading image:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      onProgress?.({
        progress: 0,
        isUploading: false,
        error: errorMessage
      })
      throw error
    }
  }

  // Upload multiple images
  static async uploadMultipleImages(
    files: FileList | File[], 
    path: string,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<string[]> {
    try {
      const fileArray = Array.from(files)
      const uploadPromises = fileArray.map((file, index) => 
        this.uploadImage(
          file, 
          path, 
          onProgress ? (progress) => onProgress(index, progress) : undefined
        )
      )

      return await Promise.all(uploadPromises)
    } catch (error) {
      console.error('Error uploading multiple images:', error)
      throw error
    }
  }

  // Delete image (placeholder - would need backend implementation)
  static async deleteImage(imageUrl: string): Promise<void> {
    try {
      console.log('Delete image (not implemented in backend yet):', imageUrl)
      // Would need backend DELETE endpoint
    } catch (error) {
      console.error('Error deleting image:', error)
      throw error
    }
  }

  // Resize image before upload (client-side)
  static resizeImage(
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

  // Validate image file
  static validateImage(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Sadece JPEG, PNG ve WebP formatları desteklenir'
      }
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Dosya boyutu 5MB\'dan küçük olmalıdır'
      }
    }

    return { isValid: true }
  }

  // Generate thumbnail
  static generateThumbnail(
    file: File,
    width: number = 150,
    height: number = 150
  ): Promise<File> {
    return this.resizeImage(file, width, height, 0.7)
  }

  // Get image metadata
  static getImageMetadata(file: File): Promise<{
    width: number
    height: number
    size: number
    type: string
    name: string
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: file.size,
          type: file.type,
          name: file.name
        })
        URL.revokeObjectURL(img.src)
      }

      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  // Create image variants (using backend optimization)
  static async createImageVariants(file: File, basePath: string): Promise<{
    thumbnail: string
    medium: string
    large: string
    original: string
  }> {
    try {
      // Upload original and let backend create variants
      const originalUrl = await this.uploadImage(file, `${basePath}/original`)
      
      // For now, return same URL for all variants
      // In the future, backend could create multiple sizes
      return {
        thumbnail: originalUrl,
        medium: originalUrl,
        large: originalUrl,
        original: originalUrl
      }
    } catch (error) {
      console.error('Error creating image variants:', error)
      throw error
    }
  }

  // Batch delete images
  static async deleteMultipleImages(imageUrls: string[]): Promise<void> {
    try {
      const deletePromises = imageUrls.map(url => this.deleteImage(url))
      await Promise.all(deletePromises)
    } catch (error) {
      console.error('Error deleting multiple images:', error)
      throw error
    }
  }
}

// Helper functions
export const getImagePath = (category: string, productId?: string) => {
  if (productId) {
    return `products/${category}/${productId}/images`
  }
  return `products/${category}/images`
}

export const getCategoryImagePath = (categorySlug: string) => {
  return `categories/${categorySlug}/images`
}

export const getDocumentPath = (productId: string) => {
  return `products/${productId}/documents`
}

export const getUserImagePath = (userId: string) => {
  return `users/${userId}/images`
}

// File size formatter
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Image type checker
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/')
}

// Get file extension
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || ''
}

// Status indicator
console.log('🚀 ImageService: Using PostgreSQL Backend with Cloudinary (Firebase removed)')