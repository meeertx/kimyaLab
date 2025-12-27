import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import Molecules3D from '../Molecules3D/Molecules3D'

const Hero: React.FC = () => {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  })

  // Parallax effects
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0])

  // Floating animation variants
  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  const moleculeFloatingVariants = {
    animate: {
      y: [0, -30, 0],
      x: [0, 10, -10, 0],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-scientific-blue-50 to-scientific-green-50" />
      
      {/* 3D Molecules Background */}
      <motion.div
        style={{ y, opacity: useTransform(scrollYProgress, [0, 1], [1, 0.3]) }}
        className="absolute inset-0 opacity-30"
      >
        <Molecules3D height="200vh" />
      </motion.div>
      
      {/* Additional floating CSS molecules for layered effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Small CSS molecules for extra particles */}
        <motion.div
          variants={moleculeFloatingVariants}
          animate="animate"
          className="absolute top-20 right-10 w-16 h-16 opacity-10"
        >
          <div className="relative">
            <div className="w-3 h-3 bg-accent-gold-400 rounded-full absolute top-0 left-0 animate-pulse" />
            <div className="w-2 h-2 bg-scientific-blue-400 rounded-full absolute top-4 left-3 animate-pulse animation-delay-200" />
            <div className="absolute top-1 left-1 w-3 h-0.5 bg-gradient-to-r from-accent-gold-400 to-scientific-blue-400 rotate-45 opacity-60" />
          </div>
        </motion.div>

        <motion.div
          variants={moleculeFloatingVariants}
          animate="animate"
          className="absolute bottom-32 left-20 w-12 h-12 opacity-15"
          style={{ animationDelay: '3s' }}
        >
          <div className="relative">
            <div className="w-2 h-2 bg-blue-400 rounded-full absolute top-0 left-0 animate-pulse" />
            <div className="w-3 h-3 bg-green-400 rounded-full absolute top-2 left-2 animate-pulse animation-delay-400" />
            <div className="absolute top-1 left-1 w-2 h-0.5 bg-gradient-to-r from-blue-400 to-green-400 -rotate-30 opacity-60" />
          </div>
        </motion.div>

        <motion.div
          variants={moleculeFloatingVariants}
          animate="animate"
          className="absolute top-40 left-1/3 w-14 h-14 opacity-12"
          style={{ animationDelay: '5s' }}
        >
          <div className="relative">
            <div className="w-2 h-2 bg-purple-400 rounded-full absolute top-0 left-1 animate-pulse" />
            <div className="w-3 h-3 bg-pink-400 rounded-full absolute top-3 left-3 animate-pulse animation-delay-300" />
            <div className="w-2 h-2 bg-orange-400 rounded-full absolute top-1 left-4 animate-pulse animation-delay-600" />
            <div className="absolute top-1 left-2 w-2 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rotate-60 opacity-60" />
            <div className="absolute top-2 left-3 w-1 h-0.5 bg-gradient-to-r from-pink-400 to-orange-400 -rotate-45 opacity-60" />
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <motion.div 
        style={{ y, opacity }}
        className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto"
      >
        
        {/* Main Title */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="mb-8"
        >
          <motion.h1 
            variants={floatingVariants}
            animate="animate"
            className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6"
          >
            <span className="text-gradient">
              {t('hero.title')}
            </span>
          </motion.h1>
          
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-primary-700 mb-8"
          >
            {t('hero.subtitle')}
          </motion.h2>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-lg sm:text-xl text-primary-600 max-w-3xl mx-auto mb-12 leading-relaxed"
        >
          {t('hero.description')}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-6 justify-center items-center"
        >
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center space-x-2">
              <span>{t('hero.cta_primary')}</span>
              <motion.svg
                whileHover={{ x: 5 }}
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5M6 12h12" />
              </motion.svg>
            </span>
            {/* Button glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent-gold-400 via-accent-pink-300 to-accent-lavender-300 opacity-0 group-hover:opacity-20 transition-opacity duration-300 rounded-full" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="btn-secondary group"
          >
            <span className="flex items-center space-x-2">
              <motion.svg
                whileHover={{ scale: 1.1 }}
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </motion.svg>
              <span>{t('hero.cta_secondary')}</span>
            </span>
          </motion.button>
        </motion.div>

      </motion.div>
    </section>
  )
}

export default Hero