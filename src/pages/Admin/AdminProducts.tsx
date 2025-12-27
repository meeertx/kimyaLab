import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout/AdminLayout'
import OptimizedProductList from '../../components/OptimizedProductList/OptimizedProductList'

const AdminProducts: React.FC = () => {

  return (
    <AdminLayout
      title="Ürün Yönetimi"
      breadcrumb={[{ label: 'Dashboard', href: '/admin' }, { label: 'Ürün Yönetimi' }]}
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ürün Yönetimi</h1>
            <p className="text-gray-600 mt-1">Tüm ürünleri görüntüleyin ve yönetin</p>
          </div>
          <Link
            to="/admin/products/add"
            className="bg-scientific-blue-500 hover:bg-scientific-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2 shadow-lg"
          >
            <span>➕</span>
            <span>Yeni Ürün Ekle</span>
          </Link>
        </motion.div>

        {/* Optimized Product List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <OptimizedProductList
            showActions={true}
            pageSize={50}
            enableVirtualization={true}
          />
        </motion.div>
      </div>
    </AdminLayout>
  )
}

export default AdminProducts