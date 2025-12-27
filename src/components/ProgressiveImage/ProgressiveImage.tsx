import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

interface ProgressiveImageProps {
  src: string
  alt: string
  placeholder?: string
  lowQualitySrc?: string
  className?: string
  style?: React.CSSProperties
  onLoad?: () => void
  onError?: (error: any) => void
  lazy?: boolean
  threshold?: number
  quality?: 'low' | 'medium' | 'high'
  blur?: boolean
  showProgress?: boolean
}

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  placeholder,
  lowQualitySrc,
  className = '',
  style = {},
  onLoad,
  onError,
  lazy = true,
  threshold = 0.1,
  quality = 'medium',
  blur = true,
  showProgress = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isLowQualityLoaded, setIsLowQualityLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isIntersecting, setIsIntersecting] = useState(!lazy)
  const [loadProgress, setLoadProgress] = useState(0)
  
  const imgRef = useRef<HTMLImageElement>(null)
  const lowQualityImgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver>()

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isIntersecting) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true)
            observerRef.current?.disconnect()
          }
        })
      },
      { threshold }
    )

    if (containerRef.current) {
      observerRef.current.observe(containerRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [lazy, threshold, isIntersecting])

  // Load low quality image first
  useEffect(() => {
    if (!isIntersecting || !lowQualitySrc) return

    const lowQualityImg = new Image()
    lowQualityImg.onload = () => {
      setIsLowQualityLoaded(true)
    }
    lowQualityImg.onerror = () => {
      console.warn('Low quality image failed to load:', lowQualitySrc)
    }
    lowQualityImg.src = lowQualitySrc
  }, [isIntersecting, lowQualitySrc])

  // Load high quality image
  useEffect(() => {
    if (!isIntersecting) return

    const img = new Image()
    
    // Progress tracking for supported browsers
    if (showProgress && 'fetch' in window) {
      loadImageWithProgress(src)
        .then(() => {
          setIsLoaded(true)
          setLoadProgress(100)
          onLoad?.()
        })
        .catch((error) => {
          setHasError(true)
          onError?.(error)
        })
    } else {
      img.onload = () => {
        setIsLoaded(true)
        onLoad?.()
      }
      img.onerror = (error) => {
        setHasError(true)
        onError?.(error)
      }
      img.src = src
    }

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [isIntersecting, src, onLoad, onError, showProgress])

  // Load image with progress tracking
  const loadImageWithProgress = useCallback(async (imageSrc: string): Promise<void> => {
    try {
      const response = await fetch(imageSrc)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const contentLength = response.headers.get('Content-Length')
      if (!contentLength || !response.body) {
        // Fallback to regular loading
        const img = new Image()
        img.src = imageSrc
        return new Promise((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = reject
        })
      }

      const totalBytes = parseInt(contentLength, 10)
      let loadedBytes = 0
      
      const reader = response.body.getReader()
      const chunks: Uint8Array[] = []

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        chunks.push(value)
        loadedBytes += value.length
        
        const progress = (loadedBytes / totalBytes) * 100
        setLoadProgress(Math.round(progress))
      }

      // Create blob and object URL
      const blob = new Blob(chunks as BlobPart[])
      const imageUrl = URL.createObjectURL(blob)
      
      // Load the final image
      const img = new Image()
      return new Promise((resolve, reject) => {
        img.onload = () => {
          URL.revokeObjectURL(imageUrl) // Cleanup
          resolve()
        }
        img.onerror = reject
        img.src = imageUrl
      })
    } catch (error) {
      throw error
    }
  }, [])

  // Get placeholder based on quality
  const getPlaceholder = () => {
    if (placeholder) return placeholder
    
    // Generate SVG placeholder based on quality
    const width = 400
    const height = 300
    const colors = {
      low: '#f3f4f6',
      medium: '#e5e7eb',  
      high: '#d1d5db'
    }
    
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${colors[quality]}"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6b7280" font-family="Arial, sans-serif" font-size="16">
          Loading...
        </text>
      </svg>
    `
    
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  // Error placeholder
  const getErrorPlaceholder = () => {
    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#fef2f2"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#ef4444" font-family="Arial, sans-serif" font-size="16">
          ❌ Image failed to load
        </text>
      </svg>
    `
    
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      {/* Error state */}
      {hasError && (
        <motion.img
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          src={getErrorPlaceholder()}
          alt={`${alt} - failed to load`}
          className="w-full h-full object-cover"
        />
      )}

      {/* Loading states */}
      {!hasError && (
        <>
          {/* Placeholder */}
          {!isLowQualityLoaded && !isLoaded && (
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={getPlaceholder()}
              alt={`${alt} - loading`}
              className="w-full h-full object-cover"
            />
          )}

          {/* Low quality image */}
          {lowQualitySrc && isLowQualityLoaded && !isLoaded && (
            <motion.img
              ref={lowQualityImgRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={lowQualitySrc}
              alt={`${alt} - low quality`}
              className={`w-full h-full object-cover ${blur ? 'blur-sm' : ''}`}
            />
          )}

          {/* High quality image */}
          {isLoaded && (
            <motion.img
              ref={imgRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              src={src}
              alt={alt}
              className="w-full h-full object-cover"
            />
          )}

          {/* Progress indicator */}
          {showProgress && !isLoaded && loadProgress > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/20"
            >
              <div className="bg-white rounded-full p-3">
                <div className="relative w-8 h-8">
                  <svg className="transform -rotate-90 w-8 h-8">
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="transparent"
                      className="text-gray-200"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * 14}`}
                      strokeDashoffset={`${2 * Math.PI * 14 * (1 - loadProgress / 100)}`}
                      className="text-scientific-blue-500 transition-all duration-300"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium">{loadProgress}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Loading shimmer effect */}
          {!isLoaded && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                repeat: Infinity,
                duration: 1.5,
                ease: 'linear'
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          )}
        </>
      )}

      {/* Overlay for additional info */}
      {!lazy && !isIntersecting && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-500 text-sm">🔄 Lazy loading...</span>
        </div>
      )}
    </div>
  )
}

export default ProgressiveImage

// Higher-order component for easy integration
export const withProgressiveImage = (
  Component: React.ComponentType<any>,
  defaultProps?: Partial<ProgressiveImageProps>
) => {
  return (props: any) => {
    return <Component {...props} ImageComponent={ProgressiveImage} imageDefaults={defaultProps} />
  }
}

// Utility function to generate low-quality placeholder
export const generateLowQualityPlaceholder = (
  originalSrc: string,
  width = 40,
  height = 30,
  quality = 0.3
): string => {
  // In a real application, you would use a service like Cloudinary or ImageKit
  // For now, we'll return a simple placeholder
  return `${originalSrc}?w=${width}&h=${height}&q=${quality * 100}&blur=5`
}

// Hook for managing multiple progressive images
export const useProgressiveImages = (
  images: Array<{ src: string; lowQualitySrc?: string }>,
  options?: { preloadNext?: number; lazy?: boolean }
) => {
  const { preloadNext = 1, lazy = true } = options || {}
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [currentIndex, setCurrentIndex] = useState(0)

  // Preload next images
  useEffect(() => {
    if (!preloadNext || lazy) return

    const preloadCount = Math.min(preloadNext, images.length - currentIndex - 1)
    
    for (let i = 1; i <= preloadCount; i++) {
      const nextImage = images[currentIndex + i]
      if (nextImage && !loadedImages.has(nextImage.src)) {
        const img = new Image()
        img.onload = () => {
          setLoadedImages(prev => new Set([...prev, nextImage.src]))
        }
        img.src = nextImage.src
      }
    }
  }, [currentIndex, images, preloadNext, loadedImages, lazy])

  return {
    loadedImages,
    setCurrentIndex,
    currentIndex,
    isLoaded: (src: string) => loadedImages.has(src)
  }
}