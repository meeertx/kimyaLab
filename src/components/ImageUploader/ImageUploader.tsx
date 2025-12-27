import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ImageService, UploadProgress, formatFileSize, isImageFile } from '../../services/imageService'

interface ImageUploaderProps {
  onImagesUploaded: (imageUrls: string[]) => void
  maxImages?: number
  path: string
  existingImages?: string[]
  className?: string
  allowMultiple?: boolean
  showPreview?: boolean
  resizeImages?: boolean
  maxFileSize?: number // in MB
}

interface ImagePreview {
  file: File
  preview: string
  uploading: boolean
  progress: number
  uploaded: boolean
  url?: string
  error?: string
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImagesUploaded,
  maxImages = 5,
  path,
  existingImages = [],
  className = '',
  allowMultiple = true,
  showPreview = true,
  resizeImages = true,
  maxFileSize = 5
}) => {
  const [images, setImages] = useState<ImagePreview[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return

    const newImages: ImagePreview[] = []
    const fileArray = Array.from(files)

    // Validate and prepare files
    for (const file of fileArray) {
      if (!isImageFile(file)) {
        alert(`${file.name} bir resim dosyası değil`)
        continue
      }

      if (file.size > maxFileSize * 1024 * 1024) {
        alert(`${file.name} dosyası ${maxFileSize}MB'dan büyük`)
        continue
      }

      if (!allowMultiple && newImages.length >= 1) {
        break
      }

      if (images.length + newImages.length >= maxImages) {
        alert(`En fazla ${maxImages} resim yükleyebilirsiniz`)
        break
      }

      const preview: ImagePreview = {
        file,
        preview: URL.createObjectURL(file),
        uploading: false,
        progress: 0,
        uploaded: false
      }

      newImages.push(preview)
    }

    setImages(prev => [...prev, ...newImages])
  }, [images.length, maxImages, allowMultiple, maxFileSize])

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
    setDragActive(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    // Clear input for re-selection
    e.target.value = ''
  }, [handleFiles])

  const removeImage = useCallback((index: number) => {
    setImages(prev => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].preview)
      updated.splice(index, 1)
      return updated
    })
  }, [])

  const uploadImages = useCallback(async () => {
    if (images.length === 0 || uploading) return

    setUploading(true)
    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < images.length; i++) {
        const image = images[i]
        if (image.uploaded) {
          uploadedUrls.push(image.url!)
          continue
        }

        setImages(prev => {
          const updated = [...prev]
          updated[i] = { ...updated[i], uploading: true, progress: 0 }
          return updated
        })

        try {
          let fileToUpload = image.file

          // Resize image if enabled
          if (resizeImages && image.file.size > 1024 * 1024) { // 1MB
            fileToUpload = await ImageService.resizeImage(image.file, 1024, 1024, 0.8)
          }

          const url = await ImageService.uploadImage(
            fileToUpload,
            path,
            (progress: UploadProgress) => {
              setImages(prev => {
                const updated = [...prev]
                updated[i] = {
                  ...updated[i],
                  progress: progress.progress,
                  error: progress.error
                }
                return updated
              })
            }
          )

          setImages(prev => {
            const updated = [...prev]
            updated[i] = {
              ...updated[i],
              uploading: false,
              uploaded: true,
              url,
              progress: 100
            }
            return updated
          })

          uploadedUrls.push(url)

        } catch (error) {
          setImages(prev => {
            const updated = [...prev]
            updated[i] = {
              ...updated[i],
              uploading: false,
              error: error instanceof Error ? error.message : 'Yükleme hatası'
            }
            return updated
          })
        }
      }

      onImagesUploaded([...existingImages, ...uploadedUrls])
    } finally {
      setUploading(false)
    }
  }, [images, uploading, path, resizeImages, existingImages, onImagesUploaded])

  const clearAll = useCallback(() => {
    images.forEach(img => URL.revokeObjectURL(img.preview))
    setImages([])
  }, [images])

  return (
    <div className={`w-full ${className}`}>
      {/* Upload Area */}
      <motion.div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
          dragActive
            ? 'border-scientific-blue-500 bg-scientific-blue-50'
            : 'border-gray-300 hover:border-scientific-blue-400 hover:bg-gray-50'
        }`}
      >
        <input
          type="file"
          multiple={allowMultiple}
          accept="image/*"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        
        <div className="space-y-4">
          <div className="text-6xl">📸</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-700">
              {dragActive ? 'Resimler buraya bırak' : 'Resim yüklemek için tıkla veya sürükle'}
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              PNG, JPG, WebP formatları desteklenir • Maksimum {maxFileSize}MB
            </p>
            <p className="text-xs text-gray-400">
              {allowMultiple ? `En fazla ${maxImages} resim` : '1 resim'} yükleyebilirsiniz
            </p>
          </div>
        </div>
      </motion.div>

      {/* Image Previews */}
      {showPreview && images.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-gray-700">
              Seçilen Resimler ({images.length})
            </h4>
            <div className="flex space-x-2">
              <button
                onClick={clearAll}
                disabled={uploading}
                className="text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
              >
                Tümünü Temizle
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {images.map((image, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative bg-white rounded-lg border border-gray-200 p-2"
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={image.preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Upload Status */}
                  <div className="mt-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="truncate flex-1 mr-2">
                        {image.file.name}
                      </span>
                      <span className="text-gray-500">
                        {formatFileSize(image.file.size)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {image.uploading && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <motion.div
                          className="bg-scientific-blue-500 h-1.5 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${image.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}

                    {/* Status Indicators */}
                    <div className="flex justify-between items-center mt-1">
                      <div className="text-xs">
                        {image.uploading && (
                          <span className="text-blue-600">Yükleniyor... {Math.round(image.progress)}%</span>
                        )}
                        {image.uploaded && (
                          <span className="text-green-600">✓ Yüklendi</span>
                        )}
                        {image.error && (
                          <span className="text-red-600">✗ {image.error}</span>
                        )}
                        {!image.uploading && !image.uploaded && !image.error && (
                          <span className="text-gray-500">Beklemede</span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => removeImage(index)}
                        disabled={image.uploading}
                        className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Upload Button */}
          <div className="flex justify-center mt-6">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={uploadImages}
              disabled={uploading || images.every(img => img.uploaded)}
              className="bg-scientific-blue-500 hover:bg-scientific-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Yükleniyor...</span>
                </>
              ) : (
                <>
                  <span>📤</span>
                  <span>Resimleri Yükle</span>
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default ImageUploader