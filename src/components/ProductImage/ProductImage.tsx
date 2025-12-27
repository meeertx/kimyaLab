import React, { useState } from 'react'
import { motion } from 'framer-motion'

interface ProductImageProps {
  src?: string
  alt?: string
  className?: string
  placeholderClassName?: string
  showPlaceholder?: boolean
}

const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt = 'Product image',
  className = '',
  placeholderClassName = '',
  showPlaceholder = true
}) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // Check if it's a mock URL - ensure src is a string
  const isMockUrl = src && typeof src === 'string' && src.startsWith('/mock-uploads/')

  // Generate placeholder style based on alt text
  const generatePlaceholderIcon = (altText: string) => {
    const text = altText.toLowerCase()
    if (text.includes('chemical') || text.includes('kimya')) return '🧪'
    if (text.includes('acid') || text.includes('asit')) return '⚗️'
    if (text.includes('base') || text.includes('baz')) return '🥽'
    if (text.includes('solution') || text.includes('çözelti')) return '💧'
    if (text.includes('powder') || text.includes('toz')) return '🧂'
    if (text.includes('buffer')) return '📊'
    if (text.includes('reagent')) return '🔬'
    return '🧪' // Default chemistry icon
  }

  const PlaceholderComponent = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`
        bg-gradient-to-br from-scientific-blue-50 to-accent-gold-50
        flex items-center justify-center text-4xl
        border-2 border-dashed border-scientific-blue-200
        ${placeholderClassName || className}
      `}
    >
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="text-center"
      >
        <div className="text-5xl mb-2">
          {generatePlaceholderIcon(alt)}
        </div>
        <div className="text-xs text-scientific-blue-600 font-medium">
          No Image
        </div>
      </motion.div>
    </motion.div>
  )

  // If no src, show placeholder
  if (!src) {
    return showPlaceholder ? <PlaceholderComponent /> : null
  }

  return (
    <div className={`relative ${className}`}>
      {imageLoading && (
        <div className={`absolute inset-0 bg-gray-100 animate-pulse ${className}`} />
      )}
      
      <motion.img
        initial={{ opacity: 0 }}
        animate={{ opacity: imageError ? 0 : 1 }}
        transition={{ duration: 0.3 }}
        src={isMockUrl ? `http://localhost:5001${src}` : src}
        alt={alt}
        className={`${className} ${imageLoading ? 'invisible' : 'visible'}`}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageError(true)
          setImageLoading(false)
        }}
      />
      
      {imageError && showPlaceholder && (
        <div className="absolute inset-0">
          <PlaceholderComponent />
        </div>
      )}
    </div>
  )
}

export default ProductImage