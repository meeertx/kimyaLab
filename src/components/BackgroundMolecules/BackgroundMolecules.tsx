import React from 'react'
import { motion } from 'framer-motion'

interface BackgroundMoleculesProps {
  intensity?: 'light' | 'medium' | 'strong'
  className?: string
}

const BackgroundMolecules: React.FC<BackgroundMoleculesProps> = ({
  intensity = 'light',
  className = ''
}) => {
  // Different molecule configurations based on intensity
  const getOpacity = () => {
    switch (intensity) {
      case 'light': return 'opacity-20'
      case 'medium': return 'opacity-30'
      case 'strong': return 'opacity-40'
      default: return 'opacity-20'
    }
  }

  const getMoleculeCount = () => {
    switch (intensity) {
      case 'light': return 8
      case 'medium': return 12
      case 'strong': return 18
      default: return 8
    }
  }

  // Floating animation variants for different molecules
  const floatingVariants = {
    animate: (i: number) => ({
      y: [0, -30 - i * 5, 0],
      x: [0, 15 - i * 3, -15 + i * 2, 0],
      rotate: [0, 10 - i * 2, -10 + i * 2, 0],
      transition: {
        duration: 8 + i * 2,
        repeat: Infinity,
        ease: "easeInOut",
        delay: i * 0.5
      }
    })
  }

  // Generate random positions for molecules
  const generateMolecules = () => {
    const molecules = []
    const moleculeCount = getMoleculeCount()
    
    for (let i = 0; i < moleculeCount; i++) {
      const top = Math.random() * 80 + 10 // 10% to 90%
      const left = Math.random() * 80 + 10 // 10% to 90%
      const size = 24 + Math.random() * 16 // 24px to 40px
      const moleculeType = Math.floor(Math.random() * 4)

      molecules.push({
        id: i,
        top: `${top}%`,
        left: `${left}%`,
        size,
        type: moleculeType
      })
    }
    
    return molecules
  }

  const molecules = generateMolecules()

  const renderMolecule = (type: number, size: number) => {
    const atomSize = size * 0.3
    
    switch (type) {
      case 0: // Water-like molecule
        return (
          <div className="relative" style={{ width: size, height: size }}>
            <div
              className="bg-blue-500 rounded-full absolute animate-pulse shadow-lg"
              style={{
                width: atomSize,
                height: atomSize,
                top: 0,
                left: size * 0.4
              }}
            />
            <div
              className="bg-red-500 rounded-full absolute animate-pulse shadow-lg"
              style={{
                width: atomSize * 0.8,
                height: atomSize * 0.8,
                top: size * 0.6,
                left: 0,
                animationDelay: '0.5s'
              }}
            />
            <div
              className="bg-red-500 rounded-full absolute animate-pulse shadow-lg"
              style={{
                width: atomSize * 0.8,
                height: atomSize * 0.8,
                top: size * 0.6,
                right: 0,
                animationDelay: '1s'
              }}
            />
            {/* Bonds */}
            <div
              className="absolute bg-gradient-to-r from-blue-500 to-red-500 opacity-80"
              style={{
                width: size * 0.3,
                height: 2,
                top: size * 0.4,
                left: size * 0.2,
                transform: 'rotate(-30deg)'
              }}
            />
            <div
              className="absolute bg-gradient-to-r from-blue-500 to-red-500 opacity-80"
              style={{
                width: size * 0.3,
                height: 2,
                top: size * 0.4,
                right: size * 0.2,
                transform: 'rotate(30deg)'
              }}
            />
          </div>
        )
      
      case 1: // Benzene-like ring
        return (
          <div className="relative" style={{ width: size, height: size }}>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i * 60) * Math.PI / 180
              const radius = size * 0.35
              const x = radius * Math.cos(angle) + size * 0.4
              const y = radius * Math.sin(angle) + size * 0.4
              
              return (
                <div
                  key={i}
                  className="bg-gray-600 rounded-full absolute animate-pulse shadow-lg"
                  style={{
                    width: atomSize * 0.8,
                    height: atomSize * 0.8,
                    left: x,
                    top: y,
                    animationDelay: `${i * 0.2}s`
                  }}
                />
              )
            })}
          </div>
        )
      
      case 2: // Simple diatomic molecule
        return (
          <div className="relative" style={{ width: size, height: size }}>
            <div
              className="bg-green-500 rounded-full absolute animate-pulse shadow-lg"
              style={{
                width: atomSize,
                height: atomSize,
                top: size * 0.3,
                left: size * 0.1
              }}
            />
            <div
              className="bg-yellow-500 rounded-full absolute animate-pulse shadow-lg"
              style={{
                width: atomSize * 0.9,
                height: atomSize * 0.9,
                top: size * 0.3,
                right: size * 0.1,
                animationDelay: '0.7s'
              }}
            />
            {/* Bond */}
            <div
              className="absolute bg-gradient-to-r from-green-500 to-yellow-500 opacity-80"
              style={{
                width: size * 0.6,
                height: 3,
                top: size * 0.4,
                left: size * 0.2
              }}
            />
          </div>
        )
      
      default: // Tetrahedral-like molecule
        return (
          <div className="relative" style={{ width: size, height: size }}>
            <div
              className="bg-purple-500 rounded-full absolute animate-pulse shadow-lg"
              style={{
                width: atomSize,
                height: atomSize,
                top: size * 0.1,
                left: size * 0.4
              }}
            />
            <div
              className="bg-orange-500 rounded-full absolute animate-pulse shadow-lg"
              style={{
                width: atomSize * 0.8,
                height: atomSize * 0.8,
                top: size * 0.7,
                left: size * 0.1,
                animationDelay: '0.3s'
              }}
            />
            <div
              className="bg-orange-500 rounded-full absolute animate-pulse shadow-lg"
              style={{
                width: atomSize * 0.8,
                height: atomSize * 0.8,
                top: size * 0.7,
                right: size * 0.1,
                animationDelay: '0.6s'
              }}
            />
            <div
              className="bg-orange-500 rounded-full absolute animate-pulse shadow-lg"
              style={{
                width: atomSize * 0.8,
                height: atomSize * 0.8,
                top: size * 0.4,
                left: size * 0.7,
                animationDelay: '0.9s'
              }}
            />
          </div>
        )
    }
  }

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${getOpacity()} ${className}`}>
      {molecules.map((molecule) => (
        <motion.div
          key={molecule.id}
          custom={molecule.id}
          variants={floatingVariants}
          animate="animate"
          className="absolute"
          style={{
            top: molecule.top,
            left: molecule.left
          }}
        >
          {renderMolecule(molecule.type, molecule.size)}
        </motion.div>
      ))}
      
      {/* Additional subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-scientific-blue-50/10 via-transparent to-scientific-green-50/10 pointer-events-none" />
    </div>
  )
}

export default BackgroundMolecules