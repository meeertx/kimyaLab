import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout/AdminLayout'

interface DocumentItem {
  id: string
  name: string
  type: 'PDF' | 'DOC' | 'XLS' | 'IMG'
  productId: string
  productName: string
  category: 'technical' | 'safety' | 'certificate' | 'brochure'
  size: string
  url: string
  uploadDate: string
  language: string
  version?: string
  description?: string
  isActive: boolean
}

const AdminDocuments: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    productId: '',
    category: 'technical' as DocumentItem['category'],
    description: '',
    language: 'tr',
    version: ''
  })

  useEffect(() => {
    // Mock data loading
    setTimeout(() => {
      setDocuments([
        {
          id: '1',
          name: 'Sodyum Klorür Teknik Veri Sayfası',
          type: 'PDF',
          productId: '1',
          productName: 'Sodyum Klorür Pro',
          category: 'technical',
          size: '1.2 MB',
          url: '#',
          uploadDate: '2024-01-15',
          language: 'tr',
          version: 'v1.0',
          description: 'Detaylı teknik özellikler ve kullanım bilgileri',
          isActive: true
        },
        {
          id: '2',
          name: 'Güvenlik Veri Sayfası - HCl',
          type: 'PDF',
          productId: '2',
          productName: 'Hidroklorik Asit',
          category: 'safety',
          size: '2.1 MB',
          url: '#',
          uploadDate: '2024-01-20',
          language: 'tr',
          version: 'v2.1',
          description: 'Güvenlik önlemleri ve acil durum prosedürleri',
          isActive: true
        },
        {
          id: '3',
          name: 'Analiz Sertifikası',
          type: 'PDF',
          productId: '1',
          productName: 'Sodyum Klorür Pro',
          category: 'certificate',
          size: '0.8 MB',
          url: '#',
          uploadDate: '2024-02-01',
          language: 'en',
          version: 'v1.0',
          description: 'Lot bazında analiz sonuçları',
          isActive: true
        },
        {
          id: '4',
          name: 'Ürün Broşürü',
          type: 'PDF',
          productId: '3',
          productName: 'Amino Asit Karışımı',
          category: 'brochure',
          size: '3.2 MB',
          url: '#',
          uploadDate: '2024-02-05',
          language: 'tr',
          description: 'Genel tanıtım ve uygulama alanları',
          isActive: true
        }
      ])
      setLoading(false)
    }, 500)
  }, [])

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.productName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || doc.category === selectedCategory
    const matchesType = !selectedType || doc.type === selectedType
    
    return matchesSearch && matchesCategory && matchesType
  })

  const getCategoryLabel = (category: DocumentItem['category']) => {
    switch (category) {
      case 'technical': return 'Teknik Veri'
      case 'safety': return 'Güvenlik'
      case 'certificate': return 'Sertifika'
      case 'brochure': return 'Broşür'
      default: return category
    }
  }

  const getCategoryColor = (category: DocumentItem['category']) => {
    switch (category) {
      case 'technical': return 'bg-blue-100 text-blue-800'
      case 'safety': return 'bg-red-100 text-red-800'
      case 'certificate': return 'bg-green-100 text-green-800'
      case 'brochure': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFileIcon = (type: DocumentItem['type']) => {
    switch (type) {
      case 'PDF': return '📄'
      case 'DOC': return '📝'
      case 'XLS': return '📊'
      case 'IMG': return '🖼️'
      default: return '📁'
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFormData({ ...formData, name: file.name.split('.')[0] })
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    setUploadProgress(0)
    
    // Simulate upload progress
    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(uploadInterval)
          
          // Add new document to list
          const newDoc: DocumentItem = {
            id: Date.now().toString(),
            name: formData.name,
            type: selectedFile.name.split('.').pop()?.toUpperCase() as DocumentItem['type'],
            productId: formData.productId,
            productName: 'Test Ürün',
            category: formData.category,
            size: `${(selectedFile.size / 1024 / 1024).toFixed(1)} MB`,
            url: URL.createObjectURL(selectedFile),
            uploadDate: new Date().toISOString().split('T')[0],
            language: formData.language,
            version: formData.version,
            description: formData.description,
            isActive: true
          }
          
          setDocuments([newDoc, ...documents])
          setShowUploadForm(false)
          setSelectedFile(null)
          setFormData({
            name: '',
            productId: '',
            category: 'technical',
            description: '',
            language: 'tr',
            version: ''
          })
          setUploadProgress(0)
          
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  const handleDelete = (id: string) => {
    if (window.confirm('Bu belgeyi silmek istediğinizden emin misiniz?')) {
      setDocuments(documents.filter(doc => doc.id !== id))
    }
  }

  const toggleStatus = (id: string) => {
    setDocuments(documents.map(doc =>
      doc.id === id ? { ...doc, isActive: !doc.isActive } : doc
    ))
  }

  const documentStats = {
    total: documents.length,
    technical: documents.filter(d => d.category === 'technical').length,
    safety: documents.filter(d => d.category === 'safety').length,
    certificates: documents.filter(d => d.category === 'certificate').length,
    totalSize: documents.reduce((sum, doc) => sum + parseFloat(doc.size), 0).toFixed(1)
  }

  const breadcrumb = [
    { label: 'Belge Yönetimi', href: '/admin/documents', current: true }
  ]

  if (loading) {
    return (
      <AdminLayout title="Belge Yönetimi" breadcrumb={breadcrumb}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-scientific-blue-300 border-t-scientific-blue-600 mb-4"></div>
            <p className="text-primary-600 font-medium">Belgeler yükleniyor...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Belge Yönetimi" breadcrumb={breadcrumb}>
      <div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-primary-600">Ürün belgelerini yönetin ve organize edin</p>
            </div>
            <button
              onClick={() => setShowUploadForm(true)}
              className="bg-scientific-blue-500 hover:bg-scientific-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              📎 Belge Yükle
            </button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Toplam Belge</p>
                <p className="text-3xl font-bold text-primary-800">{documentStats.total}</p>
              </div>
              <div className="w-12 h-12 bg-scientific-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📁</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Teknik Belge</p>
                <p className="text-3xl font-bold text-blue-600">{documentStats.technical}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Güvenlik Belgesi</p>
                <p className="text-3xl font-bold text-red-600">{documentStats.safety}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🛡️</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Toplam Boyut</p>
                <p className="text-2xl font-bold text-scientific-green-600">{documentStats.totalSize} MB</p>
              </div>
              <div className="w-12 h-12 bg-scientific-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💾</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white rounded-lg shadow-md p-6 mb-6"
        >
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arama
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Belge adı veya ürün..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
              >
                <option value="">Tüm Kategoriler</option>
                <option value="technical">Teknik Veri</option>
                <option value="safety">Güvenlik</option>
                <option value="certificate">Sertifika</option>
                <option value="brochure">Broşür</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dosya Türü
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
              >
                <option value="">Tüm Türler</option>
                <option value="PDF">PDF</option>
                <option value="DOC">Word</option>
                <option value="XLS">Excel</option>
                <option value="IMG">Resim</option>
              </select>
            </div>
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                <strong>{filteredDocuments.length}</strong> belge bulundu
              </div>
            </div>
          </div>
        </motion.div>

        {/* Documents Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredDocuments.map((document) => (
            <div key={document.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-3xl">{getFileIcon(document.type)}</div>
                  <div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(document.category)}`}>
                      {getCategoryLabel(document.category)}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => window.open(document.url, '_blank')}
                    className="text-scientific-blue-600 hover:text-scientific-blue-800 p-1"
                    title="İndir"
                  >
                    📥
                  </button>
                  <button
                    onClick={() => toggleStatus(document.id)}
                    className={`p-1 ${document.isActive ? 'text-green-600' : 'text-gray-400'}`}
                    title={document.isActive ? 'Aktif' : 'Pasif'}
                  >
                    {document.isActive ? '✅' : '❌'}
                  </button>
                  <button
                    onClick={() => handleDelete(document.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Sil"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {document.name}
              </h3>
              
              <div className="text-sm text-gray-600 mb-3">
                <Link to={`/urun/${document.productId}`} className="text-scientific-blue-600 hover:underline">
                  {document.productName}
                </Link>
              </div>
              
              {document.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                  {document.description}
                </p>
              )}
              
              <div className="flex justify-between items-center text-xs text-gray-400">
                <div className="flex items-center space-x-2">
                  <span>{document.size}</span>
                  <span>•</span>
                  <span>{document.language.toUpperCase()}</span>
                  {document.version && (
                    <>
                      <span>•</span>
                      <span>{document.version}</span>
                    </>
                  )}
                </div>
                <span>{new Date(document.uploadDate).toLocaleDateString('tr-TR')}</span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Upload Form Modal */}
        {showUploadForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-xl font-bold text-primary-800 mb-4">
                Yeni Belge Yükle
              </h2>
              
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dosya Seç *
                  </label>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                    required
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-500 mt-1">
                      Seçilen: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                    </p>
                  )}
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Belge Adı *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kategori *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as DocumentItem['category'] })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                    >
                      <option value="technical">Teknik Veri</option>
                      <option value="safety">Güvenlik</option>
                      <option value="certificate">Sertifika</option>
                      <option value="brochure">Broşür</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ürün ID
                    </label>
                    <input
                      type="text"
                      value={formData.productId}
                      onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dil
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                    >
                      <option value="tr">Türkçe</option>
                      <option value="en">English</option>
                      <option value="ar">العربية</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Versiyon
                    </label>
                    <input
                      type="text"
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      placeholder="v1.0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-scientific-blue-500"
                    />
                  </div>
                </div>
                
                <div>
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
                
                {uploadProgress > 0 && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-scientific-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowUploadForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedFile || uploadProgress > 0}
                    className="px-4 py-2 bg-scientific-blue-500 text-white rounded-lg hover:bg-scientific-blue-600 disabled:opacity-50"
                  >
                    {uploadProgress > 0 ? 'Yükleniyor...' : 'Yükle'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminDocuments