import React, { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  OptimizedImageService, 
  BatchUploadProgress, 
  UploadProgress,
  formatFileSize, 
  isImageFile 
} from '../../services/optimizedImageService'

interface OptimizedImageUploaderProps {
  onImagesUploaded: (imageUrls: string[]) => void
  maxImages?: number
  path: string
  existingImages?: string[]
  className?: string
  allowMultiple?: boolean
  showPreview?: boolean
  autoUpload?: boolean
  uploadOptions?: {
    resize?: boolean
    compress?: boolean
    maxWidth?: number
    maxHeight?: number
    quality?: number
    concurrency?: number
  }
}

interface ImagePreview {
  id: string
  file: File
  preview: string
  uploading: boolean
  progress: number
  uploaded: boolean
  url?: string
  error?: string
  originalSize: number
  compressedSize?: number
}

const OptimizedImageUploader: React.FC<OptimizedImageUploaderProps> = ({
  onImagesUploaded,
  maxImages = 5,
  path,
  existingImages = [],
  className = '',
  allowMultiple = true,
  showPreview = true,
  autoUpload = false,
  uploadOptions = {
    resize: true,
    compress: true,
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
    concurrency: 3
  }
}) => {
  const [images, setImages] = useState<ImagePreview[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [batchUploading, setBatchUploading] = useState(false)
  const [batchProgress, setBatchProgress] = useState<BatchUploadProgress | null>(null)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const abortController = useRef<AbortController | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup object URLs to prevent memory leaks
      images.forEach(img => {
        if (img.preview.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview)
        }
      })
      
      // Abort ongoing uploads
      if (abortController.current) {
        abortController.current.abort()
      }
    }
  }, [])

  const generateImageId = useCallback(() => {
    return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return

    const newImages: ImagePreview[] = []
    const fileArray = Array.from(files)

    // Enhanced file validation with better error handling
    for (const file of fileArray) {
      // Enhanced validation for ALL supported formats matching backend
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',  // SVG support
        'image/bmp',
        'image/tiff',
        'image/tif',     // Alternative TIFF extension
        'image/avif',    // Modern format
        'image/heic',    // iOS format
        'image/x-icon',  // ICO files
        'image/vnd.microsoft.icon' // Alternative ICO
      ]
  
      // Check file type with enhanced error message
      if (!allowedTypes.includes(file.type)) {
        console.warn(`❌ File type rejected: ${file.name} (${file.type})`)
        alert(`${file.name}: Desteklenmeyen dosya formatı.\n\n✅ Desteklenen formatlar:\nPNG, JPG, JPEG, WebP, GIF, SVG, BMP, TIFF, AVIF, HEIC\n\n📁 Dosya türü: ${file.type}`)
        continue
      }
  
      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024
      if (file.size > maxSize) {
        console.warn(`❌ File size too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
        alert(`${file.name}: Dosya boyutu çok büyük (${(file.size / 1024 / 1024).toFixed(1)}MB).\n\n📏 Maksimum boyut: 10MB`)
        continue
      }
      
      // Minimum size check
      if (file.size < 100) { // 100 bytes minimum
        console.warn(`❌ File too small: ${file.name} (${file.size} bytes)`)
        alert(`${file.name}: Dosya çok küçük görünüyor. Lütfen geçerli bir resim dosyası seçin.`)
        continue
      }

      if (!allowMultiple && newImages.length >= 1) {
        alert('Bu alanda sadece 1 resim yükleyebilirsiniz')
        break
      }

      if (images.length + newImages.length >= maxImages) {
        alert(`En fazla ${maxImages} resim yükleyebilirsiniz`)
        break
      }

      const imageId = generateImageId()
      const preview: ImagePreview = {
        id: imageId,
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
        progress: 0,
        uploaded: false,
        originalSize: file.size
      }

      newImages.push(preview)
    }

    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages])

      // Auto upload if enabled
      if (autoUpload) {
        setTimeout(() => {
          uploadNewImages(newImages)
        }, 500) // Small delay to show preview first
      }
    }
  }, [images.length, maxImages, allowMultiple, autoUpload])

  const uploadNewImages = useCallback(async (imagesToUpload: ImagePreview[]) => {
    const filesToUpload = imagesToUpload.map(img => img.file)
    
    setBatchUploading(true)
    abortController.current = new AbortController()

    try {
      const urls = await OptimizedImageService.uploadMultipleImages(
        filesToUpload,
        path,
        (progress: BatchUploadProgress) => {
          setBatchProgress(progress)
          
          // Update individual image progress
          setImages(prev => prev.map(img => {
            if (imagesToUpload.find(upload => upload.id === img.id)) {
              const fileProgress = Array.from(progress.fileProgresses.values())
                .find(fp => fp.fileName === img.file.name)
              
              if (fileProgress) {
                return {
                  ...img,
                  uploading: fileProgress.isUploading,
                  progress: fileProgress.progress,
                  uploaded: fileProgress.progress === 100,
                  url: fileProgress.downloadURL,
                  error: fileProgress.error,
                  compressedSize: fileProgress.fileSize
                }
              }
            }
            return img
          }))
        },
        uploadOptions
      )

      // Mark all as uploaded and store URLs
      setUploadedUrls(prev => [...prev, ...urls])
      setImages(prev => prev.map(img => {
        if (imagesToUpload.find(upload => upload.id === img.id)) {
          const urlIndex = imagesToUpload.findIndex(upload => upload.id === img.id)
          return {
            ...img,
            uploaded: true,
            uploading: false,
            progress: 100,
            url: urls[urlIndex]
          }
        }
        return img
      }))

      onImagesUploaded([...existingImages, ...uploadedUrls, ...urls])

    } catch (error) {
      console.error('Batch upload error:', error)
      alert('Bazı resimler yüklenemedi. Lütfen tekrar deneyin.')
    } finally {
      setBatchUploading(false)
      setBatchProgress(null)
      abortController.current = null
    }
  }, [path, uploadOptions, existingImages, uploadedUrls, onImagesUploaded])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragActive(false)
    }
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    e.target.value = '' // Reset for re-selection
  }, [handleFiles])

  const removeImage = useCallback((imageId: string) => {
    setImages(prev => {
      const updated = prev.filter(img => img.id !== imageId)
      const imageToRemove = prev.find(img => img.id === imageId)
      
      if (imageToRemove?.preview.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.preview)
      }
      
      return updated
    })
  }, [])

  const uploadPendingImages = useCallback(async () => {
    const pendingImages = images.filter(img => !img.uploaded && !img.uploading)
    if (pendingImages.length === 0) return

    await uploadNewImages(pendingImages)
  }, [images, uploadNewImages])

  const clearAll = useCallback(() => {
    images.forEach(img => {
      if (img.preview.startsWith('blob:')) {
        URL.revokeObjectURL(img.preview)
      }
    })
    setImages([])
    setBatchProgress(null)
  }, [images])

  const retryFailedUploads = useCallback(async () => {
    const failedImages = images.filter(img => img.error && !img.uploaded)
    if (failedImages.length === 0) return

    // Reset error states
    setImages(prev => prev.map(img => 
      failedImages.find(failed => failed.id === img.id) 
        ? { ...img, error: undefined, progress: 0 }
        : img
    ))

    await uploadNewImages(failedImages)
  }, [images, uploadNewImages])

  const pendingCount = images.filter(img => !img.uploaded && !img.uploading).length
  const uploadingCount = images.filter(img => img.uploading).length
  const uploadedCount = images.filter(img => img.uploaded).length
  const errorCount = images.filter(img => img.error).length

  return (
    <div className={`w-full ${className}`}>
      {/* Upload Area */}
      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          dragActive
            ? 'border-scientific-blue-500 bg-scientific-blue-50 scale-[1.02]'
            : 'border-gray-300 hover:border-scientific-blue-400 hover:bg-gray-50'
        }`}
        whileHover={{ scale: dragActive ? 1.02 : 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          type="file"
          multiple={allowMultiple}
          accept="image/*,.png,.jpg,.jpeg,.gif,.svg,.webp,.bmp,.tiff,.tif,.avif,.heic,.ico"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={batchUploading}
        />
        
        <div className="space-y-4">
          <motion.div 
            className="text-6xl"
            animate={{ 
              scale: dragActive ? [1, 1.1, 1] : 1,
              rotate: dragActive ? [0, 5, -5, 0] : 0 
            }}
            transition={{ duration: 0.3 }}
          >
            {batchUploading ? '⏳' : '📸'}
          </motion.div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-700">
              {dragActive ? 'Resimler buraya bırak' : 
               batchUploading ? 'Resimler yükleniyor...' :
               'Resim yüklemek için tıkla veya sürükle'}
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              ✅ <strong>Desteklenen formatlar:</strong> PNG, JPG, JPEG, WebP, GIF, SVG, BMP, TIFF, AVIF, HEIC
            </p>
            <p className="text-xs text-gray-400">
              📏 Maksimum boyut: 10MB • {allowMultiple ? `📂 En fazla ${maxImages} resim` : '📂 1 resim'} • 🔄 Otomatik sıkıştırma
            </p>
          </div>
        </div>

        {/* Batch Progress Overlay */}
        <AnimatePresence>
          {batchProgress && batchUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center"
            >
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto">
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      className="text-gray-200"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - batchProgress.overallProgress / 100)}`}
                      className="text-scientific-blue-500 transition-all duration-300"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-lg font-semibold text-scientific-blue-600">
                    {batchProgress.overallProgress}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {batchProgress.completedFiles} / {batchProgress.totalFiles} tamamlandı
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Summary Stats */}
      {images.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex justify-between items-center text-sm"
        >
          <div className="flex space-x-4">
            <span className="text-gray-600">
              📁 {images.length} dosya seçildi
            </span>
            {uploadedCount > 0 && (
              <span className="text-green-600">
                ✅ {uploadedCount} yüklendi
              </span>
            )}
            {uploadingCount > 0 && (
              <span className="text-blue-600">
                ⏳ {uploadingCount} yükleniyor
              </span>
            )}
            {errorCount > 0 && (
              <span className="text-red-600">
                ❌ {errorCount} hata
              </span>
            )}
          </div>
          
          <div className="flex space-x-2">
            {errorCount > 0 && (
              <button
                onClick={retryFailedUploads}
                disabled={batchUploading}
                className="text-red-600 hover:text-red-700 disabled:opacity-50 text-xs"
              >
                🔄 Hataları Tekrarla
              </button>
            )}
            <button
              onClick={clearAll}
              disabled={batchUploading}
              className="text-red-600 hover:text-red-700 disabled:opacity-50 text-xs"
            >
              🗑️ Tümünü Temizle
            </button>
          </div>
        </motion.div>
      )}

      {/* Image Previews Grid */}
      {showPreview && images.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <AnimatePresence mode="popLayout">
              {images.map((image) => (
                <motion.div
                  key={image.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative bg-white rounded-lg border border-gray-200 p-2 shadow-sm"
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
                    <img
                      src={image.preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Upload Progress Overlay */}
                    {image.uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="text-2xl mb-1">⏳</div>
                          <div className="text-sm font-medium">{image.progress}%</div>
                        </div>
                      </div>
                    )}

                    {/* Success Overlay */}
                    {image.uploaded && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}

                    {/* Error Overlay */}
                    {image.error && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <div className="text-red-600 text-center">
                          <div className="text-2xl mb-1">❌</div>
                          <div className="text-xs">Hata</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="mt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="truncate flex-1 mr-2 font-medium">
                        {image.file.name}
                      </span>
                      <button
                        onClick={() => removeImage(image.id)}
                        disabled={image.uploading}
                        className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50 flex-shrink-0"
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                      <span>{formatFileSize(image.originalSize)}</span>
                      {image.compressedSize && image.compressedSize !== image.originalSize && (
                        <span className="text-green-600">
                          → {formatFileSize(image.compressedSize)}
                        </span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="text-xs mt-1">
                      {image.uploading && (
                        <div className="flex items-center space-x-1">
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <motion.div
                              className="bg-scientific-blue-500 h-1 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${image.progress}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <span className="text-blue-600 whitespace-nowrap">
                            {image.progress}%
                          </span>
                        </div>
                      )}
                      {image.uploaded && (
                        <span className="text-green-600">✅ Yüklendi</span>
                      )}
                      {image.error && (
                        <span className="text-red-600" title={image.error}>
                          ❌ {image.error.length > 30 ? image.error.substring(0, 30) + '...' : image.error}
                        </span>
                      )}
                      {!image.uploading && !image.uploaded && !image.error && (
                        <span className="text-gray-500">📋 Beklemede</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Upload Button - Only show if not auto upload and has pending images */}
          {!autoUpload && pendingCount > 0 && (
            <div className="flex justify-center mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={uploadPendingImages}
                disabled={batchUploading}
                className="bg-scientific-blue-500 hover:bg-scientific-blue-600 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center space-x-3 shadow-lg"
              >
                {batchUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Yükleniyor... ({batchProgress?.completedFiles || 0}/{batchProgress?.totalFiles || 0})</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>{pendingCount} Resmi Yükle</span>
                  </>
                )}
              </motion.button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default OptimizedImageUploader