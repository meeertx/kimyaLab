import React from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

const Footer: React.FC = () => {
  const { t, i18n } = useTranslation()

  // Social media links
  const socialLinks = [
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/kimyalab',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
      )
    },
    {
      name: 'Twitter',
      href: 'https://twitter.com/kimyalab',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      )
    },
    {
      name: 'Instagram',
      href: 'https://instagram.com/kimyalab',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987c6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.291L3.654 16.95c-.48-.48-.48-1.26 0-1.74l1.472-1.472c.8-.835 1.95-1.326 3.323-1.326c2.58 0 4.67 2.09 4.67 4.67c0 1.297-.49 2.448-1.291 3.323l1.472 1.472c.48.48.48 1.26 0 1.74l-1.253 1.253c-.8.835-1.95 1.326-3.323 1.326c-2.58 0-4.67-2.09-4.67-4.67z"/>
        </svg>
      )
    },
    {
      name: 'YouTube',
      href: 'https://youtube.com/@kimyalab',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    }
  ]

  // Quick links
  const quickLinks = [
    { key: 'home', href: '#home' },
    { key: 'about', href: '#about' },
    { key: 'services', href: '#services' },
    { key: 'research', href: '#research' },
    { key: 'contact', href: '#contact' }
  ]

  return (
    <footer className="relative bg-gradient-to-br from-primary-100 to-scientific-blue-100 border-t border-primary-200">
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234f46e5' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Main Footer Content */}
      <div className="relative z-10 section-padding">
        <div className="container-responsive">
          
          {/* Top Section */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-12">
            
            {/* Company Info */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              {/* Logo */}
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-scientific-blue-500 to-scientific-green-500 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-2xl">K</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-scientific-blue-500 to-scientific-green-500 rounded-xl blur-sm opacity-30"></div>
                </div>
                <div className="font-bold text-2xl text-gradient">
                  {t('footer.company.title')}
                </div>
              </div>

              {/* Description */}
              <p className="text-primary-600 leading-relaxed mb-8 max-w-lg">
                {t('footer.company.description')}
              </p>

              {/* Contact Info */}
              <div className="space-y-4">
                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-start space-x-3 text-primary-600"
                >
                  <svg className="w-5 h-5 mt-1 text-scientific-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{t('footer.contact.address')}</span>
                </motion.div>

                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-center space-x-3 text-primary-600"
                >
                  <svg className="w-5 h-5 text-scientific-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{t('footer.contact.phone')}</span>
                </motion.div>

                <motion.div
                  whileHover={{ x: 5 }}
                  className="flex items-center space-x-3 text-primary-600"
                >
                  <svg className="w-5 h-5 text-scientific-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{t('footer.contact.email')}</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl font-bold text-primary-800 mb-6">
                {t('footer.links.title')}
              </h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.key}>
                    <motion.a
                      whileHover={{ x: 5, color: '#3b82f6' }}
                      href={link.href}
                      className="text-primary-600 hover:text-scientific-blue-500 transition-colors duration-300 inline-flex items-center space-x-2"
                    >
                      <span className="w-1.5 h-1.5 bg-scientific-blue-400 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
                      <span>{t(`footer.links.${link.key}`)}</span>
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Social Media */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-xl font-bold text-primary-800 mb-6">
                {t('footer.social.title')}
              </h3>
              <p className="text-primary-600 mb-6">{t('footer.social.follow')}</p>
              
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ 
                      scale: 1.1, 
                      y: -3,
                      boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" 
                    }}
                    whileTap={{ scale: 0.95 }}
                    className="p-3 bg-glass-light backdrop-blur-sm border border-glass-medium rounded-xl text-primary-600 hover:text-white hover:bg-gradient-to-br hover:from-scientific-blue-500 hover:to-scientific-green-500 transition-all duration-300"
                  >
                    {social.icon}
                  </motion.a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Newsletter Signup */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="border-t border-primary-200 pt-12 mb-12"
          >
            <div className="text-center max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gradient mb-4">
                Bilimsel Yenilikleri Kaçırmayın
              </h3>
              <p className="text-primary-600 mb-8">
                En son araştırmalar, projeler ve bilimsel gelişmelerden haberdar olmak için bültenimize abone olun.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="E-posta adresiniz"
                  className="flex-1 px-4 py-3 rounded-lg bg-glass-light backdrop-blur-sm border border-glass-medium focus:outline-none focus:border-scientific-blue-400 focus:ring-2 focus:ring-scientific-blue-400/20 transition-all duration-300"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-scientific-blue-500 to-scientific-green-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  Abone Ol
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Bottom Section */}
          <div className="border-t border-primary-200 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              
              {/* Copyright */}
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="text-primary-500 text-sm"
              >
                {t('footer.copyright')}
              </motion.p>

              {/* Language Indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="flex items-center space-x-2 text-primary-500 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {i18n.language === 'tr' && 'Türkçe'}
                  {i18n.language === 'en' && 'English'}
                  {i18n.language === 'ar' && 'العربية'}
                </span>
              </motion.div>

              {/* Legal Links */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="flex space-x-6 text-sm"
              >
                <a href="#privacy" className="text-primary-500 hover:text-scientific-blue-500 transition-colors duration-300">
                  Gizlilik Politikası
                </a>
                <a href="#terms" className="text-primary-500 hover:text-scientific-blue-500 transition-colors duration-300">
                  Kullanım Şartları
                </a>
                <a href="#cookies" className="text-primary-500 hover:text-scientific-blue-500 transition-colors duration-300">
                  Çerez Politikası
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer