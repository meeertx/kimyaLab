import React, { useState, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useTranslation } from 'react-i18next'

// Hooks
import { useSEO } from '../hooks/useSEO'

// Components
import Molecules3D from '../components/Molecules3D/Molecules3D'

const Contact: React.FC = () => {
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
    title: t('contact.title'),
    description: t('contact.get_in_touch'),
    keywords: ['iletişim', 'adres', 'telefon', 'e-posta', 'form', 'destek', 'yardım', 'müşteri hizmetleri'],
    type: 'website'
  })
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Form submission logic will be implemented later
    console.log('Form submitted:', formData)
  }

  const contactInfo = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      title: t('contact.address_title'),
      content: t('footer.contact.address')
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      title: t('contact.phone_title'),
      content: t('footer.contact.phone')
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: t('contact.email_title'),
      content: t('footer.contact.email')
    }
  ]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative min-h-screen pt-24 pb-12 overflow-hidden"
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
          className="absolute top-24 right-12 w-15 h-15 opacity-12"
        >
          <div className="relative">
            <div className="w-3 h-3 bg-scientific-blue-400 rounded-full absolute top-0 left-0 animate-pulse" />
            <div className="w-2 h-2 bg-scientific-green-400 rounded-full absolute top-4 left-3 animate-pulse animation-delay-200" />
            <div className="absolute top-1 left-1 w-3 h-0.5 bg-gradient-to-r from-scientific-blue-400 to-scientific-green-400 rotate-45 opacity-60" />
          </div>
        </motion.div>

        <motion.div
          variants={moleculeFloatingVariants}
          animate="animate"
          className="absolute bottom-28 left-16 w-12 h-12 opacity-15"
          style={{ animationDelay: '3s' }}
        >
          <div className="relative">
            <div className="w-2 h-2 bg-accent-pink-400 rounded-full absolute top-0 left-0 animate-pulse" />
            <div className="w-3 h-3 bg-accent-lavender-400 rounded-full absolute top-2 left-2 animate-pulse animation-delay-400" />
            <div className="absolute top-1 left-1 w-2 h-0.5 bg-gradient-to-r from-accent-pink-400 to-accent-lavender-400 -rotate-30 opacity-60" />
          </div>
        </motion.div>

        <motion.div
          variants={moleculeFloatingVariants}
          animate="animate"
          className="absolute top-48 left-1/4 w-14 h-14 opacity-10"
          style={{ animationDelay: '5s' }}
        >
          <div className="relative">
            <div className="w-2 h-2 bg-accent-gold-400 rounded-full absolute top-0 left-1 animate-pulse" />
            <div className="w-3 h-3 bg-orange-400 rounded-full absolute top-3 left-3 animate-pulse animation-delay-300" />
            <div className="w-2 h-2 bg-yellow-400 rounded-full absolute top-1 left-4 animate-pulse animation-delay-600" />
            <div className="absolute top-1 left-2 w-2 h-0.5 bg-gradient-to-r from-accent-gold-400 to-orange-400 rotate-60 opacity-60" />
            <div className="absolute top-2 left-3 w-1 h-0.5 bg-gradient-to-r from-orange-400 to-yellow-400 -rotate-45 opacity-60" />
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
            {t('contact.title')}
          </h1>
          <p className="text-2xl text-primary-600 max-w-3xl mx-auto mb-8">
            {t('contact.subtitle')}
          </p>
          <p className="text-lg text-primary-500 max-w-4xl mx-auto leading-relaxed">
            {t('contact.get_in_touch')}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16">
          
          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-gradient text-3xl font-bold mb-8">
              {t('contact.info_title')}
            </h2>
            
            <div className="space-y-6 mb-12">
              {contactInfo.map((info, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  whileHover={{ x: 10 }}
                  className="card-3d p-6 flex items-start space-x-4"
                >
                  <div className="text-scientific-blue-500 flex-shrink-0 mt-1">
                    {info.icon}
                  </div>
                  <div>
                    <h3 className="text-primary-800 font-bold text-lg mb-2">
                      {info.title}
                    </h3>
                    <p className="text-primary-600">
                      {info.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Working Hours */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="card-3d p-6"
            >
              <h3 className="text-gradient text-xl font-bold mb-4 flex items-center">
                <svg className="w-6 h-6 mr-3 text-scientific-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('contact.working_hours')}
              </h3>
              <div className="space-y-2 text-primary-600">
                <div className="flex justify-between">
                  <span>{t('contact.weekdays')}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('contact.weekend')}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="card-3d p-8">
              <h2 className="text-gradient text-3xl font-bold mb-8">
                {t('contact.form_title')}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-primary-700 font-medium mb-2">
                    {t('contact.name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-glass-light backdrop-blur-sm border border-glass-medium focus:outline-none focus:border-scientific-blue-400 focus:ring-2 focus:ring-scientific-blue-400/20 transition-all duration-300"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-primary-700 font-medium mb-2">
                    {t('contact.email')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-glass-light backdrop-blur-sm border border-glass-medium focus:outline-none focus:border-scientific-blue-400 focus:ring-2 focus:ring-scientific-blue-400/20 transition-all duration-300"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-primary-700 font-medium mb-2">
                    {t('contact.subject')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-glass-light backdrop-blur-sm border border-glass-medium focus:outline-none focus:border-scientific-blue-400 focus:ring-2 focus:ring-scientific-blue-400/20 transition-all duration-300"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-primary-700 font-medium mb-2">
                    {t('contact.message')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-glass-light backdrop-blur-sm border border-glass-medium focus:outline-none focus:border-scientific-blue-400 focus:ring-2 focus:ring-scientific-blue-400/20 transition-all duration-300 resize-vertical"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="w-full btn-neon"
                >
                  <span className="flex items-center justify-center space-x-2">
                    <span>{t('contact.send')}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </span>
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>

        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-20"
        >
          <div className="text-center mb-8">
            <h2 className="text-gradient text-3xl font-bold mb-4">
              {t('contact.location.title')}
            </h2>
            <p className="text-primary-600">
              {t('contact.location.subtitle')}
            </p>
          </div>
          
          <div className="card-3d p-2 overflow-hidden">
            <div className="w-full h-96 bg-gradient-to-br from-scientific-blue-100 to-scientific-green-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">📍</div>
                <p className="text-primary-600 text-lg font-medium">
                  {t('contact.location.map_integration')}
                </p>
                <p className="text-primary-500 text-sm">
                  {t('contact.location.map_note')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-20 text-center"
        >
          <h2 className="text-gradient text-3xl font-bold mb-8">
            {t('contact.quick_actions.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.a
              href="tel:+903121234567"
              whileHover={{ y: -5, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="card-3d p-6 text-center group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">📞</div>
              <h3 className="text-primary-800 font-bold mb-2">{t('contact.quick_actions.call_now')}</h3>
              <p className="text-primary-600">{t('contact.quick_actions.call_desc')}</p>
            </motion.a>

            <motion.a
              href="mailto:info@kimyalab.com"
              whileHover={{ y: -5, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="card-3d p-6 text-center group"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">📧</div>
              <h3 className="text-primary-800 font-bold mb-2">{t('contact.quick_actions.send_email')}</h3>
              <p className="text-primary-600">{t('contact.quick_actions.email_desc')}</p>
            </motion.a>

            <motion.div
              whileHover={{ y: -5, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="card-3d p-6 text-center group cursor-pointer"
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">💬</div>
              <h3 className="text-primary-800 font-bold mb-2">{t('contact.quick_actions.live_support')}</h3>
              <p className="text-primary-600">{t('contact.quick_actions.live_desc')}</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default Contact