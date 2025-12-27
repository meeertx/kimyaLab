import React, { useState, useEffect, useRef } from 'react'

interface EnhancedProgressiveImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  lowResSrc?: string
  onLoad?: () => void
  onError?: (error: string) => void
  priority?: boolean
  sizes?: string
  lazy?: boolean
}

const EnhancedProgressiveImage: React.FC<EnhancedProgressiveImageProps> = ({
  src,
  alt,
  className = '',
  placeholder,
  lowResSrc,
  onLoad,
  onError,
  priority = false,
  sizes,
  lazy = true
}) => {
  const [currentSrc, setCurrentSrc] = useState<string>(placeholder || lowResSrc || '')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isVisible, setIsVisible] = useState(!lazy || priority)
  const imgRef = useRef<HTMLImageElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority || isVisible) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observerRef.current?.disconnect()
          }
        })
      },
      { rootMargin: '50px' }
    )

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current)
    }

    return () => {
      observerRef.current?.disconnect()
    }
  }, [lazy, priority, isVisible])

  // Progressive image loading
  useEffect(() => {
    if (!isVisible || !src) return

    const img = new Image()
    
    img.onload = () => {
      setCurrentSrc(src)
      setIsLoading(false)
      onLoad?.()
    }

    img.onerror = () => {
      setHasError(true)
      setIsLoading(false)
      onError?.('Failed to load image')
    }

    // Start with low resolution if available
    if (lowResSrc && currentSrc !== lowResSrc) {
      const lowResImg = new Image()
      lowResImg.onload = () => setCurrentSrc(lowResSrc)
      lowResImg.src = lowResSrc
    }

    img.src = src
  }, [src, lowResSrc, isVisible, onLoad, onError, currentSrc])

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <div className="text-gray-400 text-center p-4">
          <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          <p className="text-sm">Resim yüklenemedi</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full animate-shimmer"></div>
        </div>
      )}
      
      {/* Main image */}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={`
          w-full h-full object-cover transition-all duration-500
          ${isLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}
          ${currentSrc === lowResSrc ? 'filter blur-sm' : 'filter-none'}
        `}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        style={{
          opacity: isVisible ? (isLoading ? 0.3 : 1) : 0
        }}
      />
      
      {/* Loading indicator */}
      {isLoading && isVisible && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-scientific-blue-300 border-t-scientific-blue-600"></div>
        </div>
      )}
    </div>
  )
}

export default EnhancedProgressiveImage