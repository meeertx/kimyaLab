import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import AdminLayout from '../../components/AdminLayout/AdminLayout'
import { CategoriesApi, BackendCategory } from '../../services/api/categoriesApi'

interface CategoryItem extends BackendCategory {
  productCount?: number
  children?: CategoryItem[]
}

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    parentId: ''
  })
  const [error, setError] = useState<string | null>(null)

  // Load categories from API
  const loadCategories = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await CategoriesApi.getCategories(true) // Include inactive categories for admin
      
      // Build hierarchical structure
      const hierarchicalCategories = CategoriesApi.buildCategoryTree(data)
      setCategories(hierarchicalCategories)
    } catch (err) {
      console.error('Kategoriler yüklenirken hata:', err)
      setError('Kategoriler yüklenemedi. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const categoryData = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c'),
        description: formData.description || null,
        parentId: formData.parentId || null,
        imageUrl: null,
        isActive: true,
        order: 0
      }
      
      await CategoriesApi.createCategory(categoryData)
      await loadCategories() // Reload categories
      
      setFormData({ name: '', description: '', slug: '', parentId: '' })
      setShowAddForm(false)
    } catch (err) {
      console.error('Kategori eklenirken hata:', err)
      setError('Kategori eklenemedi. Lütfen tekrar deneyin.')
    }
  }

  const handleEditCategory = (category: CategoryItem) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      slug: category.slug,
      parentId: category.parentId || ''
    })
    setShowAddForm(true)
  }

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCategory) return

    try {
      const updates = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        parentId: formData.parentId || null
      }
      
      await CategoriesApi.updateCategory(editingCategory.id, updates)
      await loadCategories() // Reload categories
      
      setEditingCategory(null)
      setFormData({ name: '', description: '', slug: '', parentId: '' })
      setShowAddForm(false)
    } catch (err) {
      console.error('Kategori güncellenirken hata:', err)
      setError('Kategori güncellenemedi. Lütfen tekrar deneyin.')
    }
  }

  const handleDeleteCategory = async (id: string, categoryName: string) => {
    if (window.confirm(`"${categoryName}" kategorisini silmek istediğinizden emin misiniz?`)) {
      try {
        await CategoriesApi.deleteCategory(id)
        await loadCategories() // Reload categories
      } catch (err) {
        console.error('Kategori silinirken hata:', err)
        setError('Kategori silinemedi. Bu kategoriye bağlı ürünler olabilir.')
      }
    }
  }

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await CategoriesApi.updateCategory(id, { isActive: !currentStatus })
      await loadCategories() // Reload categories
    } catch (err) {
      console.error('Kategori durumu güncellenirken hata:', err)
      setError('Kategori durumu güncellenemedi.')
    }
  }

  const resetForm = () => {
    setFormData({ name: '', description: '', slug: '', parentId: '' })
    setEditingCategory(null)
    setShowAddForm(false)
    setError(null)
  }

  // Flatten categories for display (including children)
  const flattenCategories = (cats: CategoryItem[], level = 0): (CategoryItem & { level: number })[] => {
    let flattened: (CategoryItem & { level: number })[] = []
    
    cats.forEach(cat => {
      flattened.push({ ...cat, level })
      if (cat.children && cat.children.length > 0) {
        flattened = flattened.concat(flattenCategories(cat.children, level + 1))
      }
    })
    
    return flattened
  }

  const displayCategories = flattenCategories(categories)

  const breadcrumb = [
    { label: 'Dashboard', href: '/admin' },
    { label: 'Kategori Yönetimi' }
  ]

  if (loading) {
    return (
      <AdminLayout title="Kategori Yönetimi" breadcrumb={breadcrumb}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-scientific-blue-300 border-t-scientific-blue-600 mb-4"></div>
            <p className="text-primary-600 font-medium">Kategoriler yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout title="Kategori Yönetimi" breadcrumb={breadcrumb}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="text-red-600 text-xl mb-4">⚠️</div>
            <p className="text-red-600 font-medium mb-4">{error}</p>
            <button
              onClick={() => loadCategories()}
              className="bg-scientific-blue-500 hover:bg-scientific-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Kategori Yönetimi" breadcrumb={breadcrumb}>
      <div className="space-y-6">
        {/* Header Actions */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-between items-center"
        >
          <p className="text-gray-600">Ürün kategorilerini yönetin</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-scientific-blue-500 hover:bg-scientific-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
          >
            <span>➕</span>
            <span>Yeni Kategori Ekle</span>
          </button>
        </motion.div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
            >
              <h2 className="text-xl font-bold text-primary-800 mb-4">
                {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
              </h2>
              
              <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori Adı *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="otomatik-olusturulur"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Boş bırakılırsa otomatik oluşturulur
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Üst Kategori
                  </label>
                  <select
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                  >
                    <option value="">Ana Kategori</option>
                    {categories.filter(cat => !cat.parentId).map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Boş bırakılırsa ana kategori olur
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-scientific-blue-500 text-white rounded-lg hover:bg-scientific-blue-600"
                  >
                    {editingCategory ? 'Güncelle' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* Categories Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ürün Sayısı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Oluşturulma Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900" style={{ paddingLeft: `${category.level * 20}px` }}>
                          {category.level > 0 && '└─ '}
                          {category.name}
                          {category.level > 0 && <span className="text-xs text-gray-400 ml-2">(Alt kategori)</span>}
                        </div>
                        <div className="text-sm text-gray-500" style={{ paddingLeft: `${category.level * 20}px` }}>
                          {category.description || 'Açıklama yok'}
                        </div>
                        <div className="text-xs text-gray-400" style={{ paddingLeft: `${category.level * 20}px` }}>
                          Slug: {category.slug}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-scientific-blue-100 text-scientific-blue-800">
                          {category.productCount || 0} ürün
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        category.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {category.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(category.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => toggleStatus(category.id, category.isActive)}
                        className={`${
                          category.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {category.isActive ? 'Pasifleştir' : 'Aktifleştir'}
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="text-red-600 hover:text-red-900"
                        disabled={(category.productCount || 0) > 0}
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8"
        >
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Toplam Kategori</p>
                <p className="text-3xl font-bold text-primary-800">{displayCategories.length}</p>
              </div>
              <div className="w-12 h-12 bg-scientific-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🗂️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Aktif Kategori</p>
                <p className="text-3xl font-bold text-green-600">
                  {displayCategories.filter(cat => cat.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Toplam Ürün</p>
                <p className="text-3xl font-bold text-scientific-blue-600">
                  {displayCategories.reduce((sum, cat) => sum + (cat.productCount || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-scientific-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🧪</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Boş Kategori</p>
                <p className="text-3xl font-bold text-orange-600">
                  {displayCategories.filter(cat => (cat.productCount || 0) === 0).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📭</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  )
}

export default AdminCategories