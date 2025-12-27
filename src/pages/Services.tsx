import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'

// Hooks
import { useSEO } from '../hooks/useSEO'

// Components
import Molecules3D from '../components/Molecules3D/Molecules3D'

const Services: React.FC = () => {
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
    title: t('services.title'),
    description: t('services.intro'),
    keywords: ['hizmetler', 'laboratuvar', 'danışmanlık', 'özel üretim', 'eğitim', 'analiz', 'test', 'validasyon'],
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

  const services = [
    {
      key: 'laboratory',
      icon: '🔬',
      features: [
        t('services.features.chemical_analysis'),
        t('services.features.test_validation'),
        t('services.features.quality_control'),
        t('services.features.sample_analysis')
      ]
    },
    {
      key: 'consulting',
      icon: '💼',
      features: [
        t('services.features.process_optimization'),
        t('services.features.technical_consulting'),
        t('services.features.project_management'),
        t('services.features.regulation_support')
      ]
    },
    {
      key: 'custom',
      icon: '⚙️',
      features: [
        t('services.features.custom_formulation'),
        t('services.features.small_scale_production'),
        t('services.features.prototype_development'),
        t('services.features.scaling')
      ]
    },
    {
      key: 'training',
      icon: '🎓',
      features: [
        t('services.features.technical_training'),
        t('services.features.safety_training'),
        t('services.features.online_support'),
        t('services.features.customer_service')
      ]
    }
  ]

  const processSteps = [
    { step: 1, title: t('services.process.need_analysis'), desc: t('services.process.need_analysis_desc') },
    { step: 2, title: t('services.process.solution_design'), desc: t('services.process.solution_design_desc') },
    { step: 3, title: t('services.process.implementation'), desc: t('services.process.implementation_desc') },
    { step: 4, title: t('services.process.support'), desc: t('services.process.support_desc') }
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
            {t('services.title')}
          </h1>
          <p className="text-2xl text-primary-600 max-w-3xl mx-auto mb-8">
            {t('services.subtitle')}
          </p>
          <p className="text-lg text-primary-500 max-w-4xl mx-auto leading-relaxed">
            {t('services.intro')}
          </p>
        </motion.div>

        {/* Services Grid */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20"
        >
          {services.map((service, index) => (
            <motion.div
              key={service.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="card-3d p-8 group"
            >
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
                {service.icon}
              </div>
              
              <h3 className="text-gradient text-2xl font-bold mb-4">
                {t(`services.${service.key}_title`)}
              </h3>
              
              <p className="text-primary-600 leading-relaxed mb-6">
                {t(`services.${service.key}_desc`)}
              </p>

              <div className="space-y-2">
                {service.features.map((feature, featureIndex) => (
                  <motion.div
                    key={featureIndex}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.1 + featureIndex * 0.05 }}
                    className="flex items-center space-x-3 text-primary-600"
                  >
                    <div className="w-2 h-2 bg-scientific-blue-400 rounded-full"></div>
                    <span className="font-medium">{feature}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Process Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-gradient text-4xl font-bold mb-6">
              {t('services.process.title')}
            </h2>
            <p className="text-primary-600 text-lg max-w-3xl mx-auto">
              {t('services.process.intro')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((process, index) => (
              <motion.div
                key={process.step}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                className="relative"
              >
                <div className="card-3d p-6 text-center h-full">
                  <div className="w-12 h-12 bg-gradient-to-r from-scientific-blue-500 to-scientific-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                    {process.step}
                  </div>
                  <h3 className="text-primary-800 font-bold text-lg mb-3">
                    {process.title}
                  </h3>
                  <p className="text-primary-600 text-sm leading-relaxed">
                    {process.desc}
                  </p>
                </div>
                
                {/* Arrow for desktop */}
                {index < processSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <motion.svg
                      className="w-6 h-6 text-scientific-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </motion.svg>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Why Choose Us Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="bg-gradient-to-r from-scientific-blue-50 to-scientific-green-50 rounded-3xl p-12 mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-gradient text-4xl font-bold mb-6">
              {t('services.advantages.title')}
            </h2>
            <p className="text-primary-600 text-lg max-w-3xl mx-auto">
              {t('services.advantages.intro')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎯',
                title: t('services.advantages.expert_team'),
                desc: t('services.advantages.expert_team_desc')
              },
              {
                icon: '⚡',
                title: t('services.advantages.fast_solution'),
                desc: t('services.advantages.fast_solution_desc')
              },
              {
                icon: '🛡️',
                title: t('services.advantages.reliable_service'),
                desc: t('services.advantages.reliable_service_desc')
              }
            ].map((advantage, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.9 + index * 0.1 }}
                whileHover={{ y: -5 }}
                className="text-center"
              >
                <div className="text-4xl mb-4">{advantage.icon}</div>
                <h3 className="text-primary-800 font-bold text-xl mb-3">
                  {advantage.title}
                </h3>
                <p className="text-primary-600 leading-relaxed">
                  {advantage.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="text-center"
        >
          <h2 className="text-gradient text-4xl font-bold mb-6">
            {t('services.cta.title')}
          </h2>
          <p className="text-primary-600 text-lg max-w-3xl mx-auto mb-8">
            {t('services.contact_cta')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="btn-neon"
            >
              {t('services.cta.contact_now')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="btn-secondary"
            >
              {t('services.cta.download_catalog')}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Services