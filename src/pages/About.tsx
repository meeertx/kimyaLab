import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'

// Hooks
import { useSEO } from '../hooks/useSEO'

// Components
import Molecules3D from '../components/Molecules3D/Molecules3D'

const About: React.FC = () => {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  })

  // Parallax effects
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3])
  
  // SEO
  useSEO({
    title: t('about.title'),
    description: t('about.intro') + ' ' + t('about.mission_text'),
    keywords: ['hakkımızda', 'kimyalab', 'şirket', 'misyon', 'vizyon', 'değerler', 'deneyim', 'uzman ekip'],
    type: 'website'
  })

  // Floating animation variants for molecules
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

  const values = [
    { key: 'quality', icon: '🏆' },
    { key: 'innovation', icon: '💡' },
    { key: 'sustainability', icon: '🌱' },
    { key: 'trust', icon: '🤝' }
  ]

  const stats = [
    { number: "15+", label: t('stats.experience') },
    { number: "500+", label: t('stats.projects') },
    { number: "50+", label: t('stats.experts') },
    { number: "1000+", label: t('stats.customers') }
  ]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen pt-24 pb-12 relative overflow-hidden"
    >
      
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-scientific-blue-50 to-scientific-green-50" />
      
      {/* 3D Molecules Background */}
      <motion.div
        style={{ y, opacity }}
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
      
      <div className="container-responsive relative z-10">
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h1 className="text-gradient text-4xl lg:text-6xl font-bold mb-6">
            {t('about.title')}
          </h1>
          <p className="text-2xl text-primary-600 max-w-3xl mx-auto mb-8">
            {t('about.subtitle')}
          </p>
          <p className="text-lg text-primary-500 max-w-4xl mx-auto leading-relaxed">
            {t('about.intro')}
          </p>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              whileHover={{ y: -5, scale: 1.05 }}
              className="card-3d p-6 text-center"
            >
              <div className="text-neon-gradient text-4xl font-bold mb-2">
                {stat.number}
              </div>
              <div className="text-primary-600 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Mission & Vision */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          
          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="card-3d p-8"
          >
            <div className="text-5xl mb-6">🎯</div>
            <h2 className="text-gradient text-3xl font-bold mb-6">
              {t('about.mission_title')}
            </h2>
            <p className="text-primary-600 text-lg leading-relaxed">
              {t('about.mission_text')}
            </p>
          </motion.div>

          {/* Vision */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="card-3d p-8"
          >
            <div className="text-5xl mb-6">🚀</div>
            <h2 className="text-gradient text-3xl font-bold mb-6">
              {t('about.vision_title')}
            </h2>
            <p className="text-primary-600 text-lg leading-relaxed">
              {t('about.vision_text')}
            </p>
          </motion.div>
        </div>

        {/* Values Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-gradient text-4xl font-bold mb-6">
              {t('about.values_title')}
            </h2>
            <p className="text-primary-600 text-lg max-w-3xl mx-auto">
              {t('about.values_intro')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.key}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className="card-3d p-6 text-center group"
              >
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {value.icon}
                </div>
                <h3 className="text-gradient text-xl font-bold mb-3">
                  {t(`about.${value.key}`)}
                </h3>
                <p className="text-primary-600 leading-relaxed">
                  {t(`about.${value.key}_desc`)}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Technology & Innovation Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="bg-gradient-to-r from-scientific-blue-50 to-scientific-green-50 rounded-3xl p-12 mb-20"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-gradient text-4xl font-bold mb-6">
                {t('about.technology_title')}
              </h2>
              <p className="text-primary-600 text-lg leading-relaxed mb-8">
                {t('about.technology_desc')}
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-neon-gradient text-2xl font-bold mb-1">ISO 9001</div>
                  <div className="text-primary-500 text-sm">{t('about.iso_cert')}</div>
                </div>
                <div className="text-center">
                  <div className="text-neon-gradient text-2xl font-bold mb-1">R&D</div>
                  <div className="text-primary-500 text-sm">{t('about.rd_center')}</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="text-8xl opacity-20 text-center"
              >
                🧪
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-br from-scientific-blue-400/20 to-scientific-green-400/20 rounded-2xl blur-xl"></div>
            </div>
          </div>
        </motion.div>

        {/* Team Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-center"
        >
          <h2 className="text-gradient text-4xl font-bold mb-6">
            {t('about.team_title')}
          </h2>
          <p className="text-primary-600 text-lg max-w-3xl mx-auto mb-12">
            {t('about.team_desc')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { role: t('about.chemical_engineers'), count: "15+", icon: "⚗️" },
              { role: t('about.biologists'), count: "12+", icon: "🧬" },
              { role: t('about.analytical_experts'), count: "8+", icon: "🔬" }
            ].map((team, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.1 + index * 0.1 }}
                whileHover={{ y: -5 }}
                className="card-3d p-8 group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {team.icon}
                </div>
                <div className="text-neon-gradient text-2xl font-bold mb-2">
                  {team.count}
                </div>
                <div className="text-primary-600 font-medium">
                  {team.role}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default About