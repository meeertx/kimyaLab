import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

interface AdminHeaderProps {
  title?: string
  breadcrumb?: { label: string; href?: string; current?: boolean }[]
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ title, breadcrumb }) => {

  const handleLogout = () => {
    // SimpleAdminRoute state'ini temizlemek için sayfayı yenile
    window.location.href = '/admin'
  }

  const goToMainSite = () => {
    window.location.href = '/'
  }

  return (
    <header className="bg-white/70 backdrop-blur-md shadow-lg border-b border-white/20 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Title and Breadcrumb */}
        <div>
          {breadcrumb && breadcrumb.length > 0 ? (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Link to="/admin" className="hover:text-indigo-600 transition-colors duration-200">
                Admin
              </Link>
              {breadcrumb.map((item, index) => (
                <React.Fragment key={index}>
                  <span className="text-gray-400">/</span>
                  {item.href && !item.current ? (
                    <Link to={item.href} className="hover:text-indigo-600 transition-colors duration-200">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-gray-900 font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{item.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              <Link to="/admin" className="hover:text-indigo-600 transition-colors duration-200">
                Admin Panel
              </Link>
            </div>
          )}
          
          {title && (
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mt-1">{title}</h1>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToMainSite}
            className="px-5 py-2.5 text-sm bg-gradient-to-r from-emerald-400 to-cyan-400 text-white rounded-xl hover:from-emerald-500 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
          >
            🌐 Siteye Dön
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="px-5 py-2.5 text-sm bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-xl hover:from-rose-500 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl font-medium"
          >
            🚪 Çıkış Yap
          </motion.button>
        </div>
      </div>
    </header>
  )
}

export default AdminHeader