import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const AdminSidebar: React.FC = () => {
  const location = useLocation()

  const menuItems = [
    {
      label: 'Dashboard',
      icon: '🏠',
      href: '/admin',
      active: location.pathname === '/admin' || location.pathname === '/admin/dashboard'
    },
    {
      label: 'Ürün Yönetimi',
      icon: '🧪',
      href: '/admin/products',
      active: location.pathname.startsWith('/admin/products')
    },
    {
      label: 'Kategori Yönetimi',
      icon: '🗂️',
      href: '/admin/categories',
      active: location.pathname === '/admin/categories'
    },
    {
      label: 'Stok Yönetimi',
      icon: '📦',
      href: '/admin/inventory',
      active: location.pathname === '/admin/inventory'
    }
  ]

  return (
    <div className="w-64 bg-white/80 backdrop-blur-md shadow-xl border-r border-white/20 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link to="/admin" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <div>
            <h1 className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Kimyalab</h1>
            <p className="text-xs text-gray-500">Admin Panel</p>
          </div>
        </Link>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                item.active
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200'
                  : 'text-gray-600 hover:bg-white/60 hover:text-indigo-600 hover:shadow-md'
              }`}
            >
              <span className="text-xl transition-transform duration-300 group-hover:scale-110">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/40 backdrop-blur-sm">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">Admin</div>
            <div className="text-xs text-gray-500">Yönetici</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSidebar