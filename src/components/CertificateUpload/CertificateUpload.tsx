import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChemicalCertificate, CertificateUploadForm } from '../../types'

interface CertificateUploadProps {
  productId?: string
  existingCertificates?: CertificateUploadForm
  onCertificatesChange: (certificates: CertificateUploadForm) => void
  disabled?: boolean
}

const CertificateUpload: React.FC<CertificateUploadProps> = ({
  productId,
  existingCertificates,
  onCertificatesChange,
  disabled = false
}) => {
  const [certificates, setCertificates] = useState<CertificateUploadForm>(
    existingCertificates || {
      sds: { tr: null, en: null, ar: null },
      coa: { tr: null, en: null, ar: null },
      msds: { tr: null, en: null, ar: null }
    }
  )

  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const [dragOver, setDragOver] = useState<string | null>(null)

  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({})

  const certificateTypes = [
    {
      key: 'sds',
      name: 'SDS (Safety Data Sheet)',
      description: 'Güvenlik Bilgi Formu',
      icon: '🛡️',
      color: 'from-red-400 to-pink-500'
    },
    {
      key: 'coa',
      name: 'COA (Certificate of Analysis)',
      description: 'Analiz Sertifikası',
      icon: '🧪',
      color: 'from-blue-400 to-indigo-500'
    },
    {
      key: 'msds',
      name: 'MSDS (Material Safety Data Sheet)',
      description: 'Malzeme Güvenlik Bilgi Formu',
      icon: '📋',
      color: 'from-green-400 to-emerald-500'
    }
  ]

  const languages = [
    { key: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { key: 'en', name: 'English', flag: '🇺🇸' },
    { key: 'ar', name: 'العربية', flag: '🇸🇦' }
  ]

  const handleFileSelect = useCallback((
    certificateType: keyof CertificateUploadForm,
    language: 'tr' | 'en' | 'ar',
    file: File
  ) => {
    if (!file.type.includes('pdf')) {
      alert('Sadece PDF dosyaları yükleyebilirsiniz.')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      alert('Dosya boyutu 10MB\'dan küçük olmalıdır.')
      return
    }

    const newCertificate: ChemicalCertificate = {
      id: `${certificateType}_${language}_${Date.now()}`,
      productId: productId || '',
      certificateType: certificateType.toUpperCase() as 'SDS' | 'COA' | 'MSDS',
      language,
      file,
      version: '1.0',
      issuedDate: new Date().toISOString(),
      isActive: true,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'admin'
    }

    const updatedCertificates = {
      ...certificates,
      [certificateType]: {
        ...certificates[certificateType],
        [language]: newCertificate
      }
    }

    setCertificates(updatedCertificates)
    onCertificatesChange(updatedCertificates)

    // Simulate upload progress
    const progressKey = `${certificateType}_${language}`
    setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }))
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const currentProgress = prev[progressKey] || 0
        if (currentProgress >= 100) {
          clearInterval(interval)
          return prev
        }
        return { ...prev, [progressKey]: currentProgress + 10 }
      })
    }, 100)
  }, [certificates, productId, onCertificatesChange])

  const handleFileInputChange = (
    certificateType: keyof CertificateUploadForm,
    language: 'tr' | 'en' | 'ar',
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(certificateType, language, file)
    }
  }

  const handleDragOver = (e: React.DragEvent, dropZoneId: string) => {
    e.preventDefault()
    setDragOver(dropZoneId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(null)
  }

  const handleDrop = (
    e: React.DragEvent,
    certificateType: keyof CertificateUploadForm,
    language: 'tr' | 'en' | 'ar'
  ) => {
    e.preventDefault()
    setDragOver(null)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(certificateType, language, file)
    }
  }

  const removeCertificate = (
    certificateType: keyof CertificateUploadForm,
    language: 'tr' | 'en' | 'ar'
  ) => {
    const updatedCertificates = {
      ...certificates,
      [certificateType]: {
        ...certificates[certificateType],
        [language]: null
      }
    }

    setCertificates(updatedCertificates)
    onCertificatesChange(updatedCertificates)
    
    // Clear upload progress
    const progressKey = `${certificateType}_${language}`
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[progressKey]
      return newProgress
    })
  }

  const getFileSize = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Byte'
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString())
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Kimyasal Sertifika Yönetimi
        </h3>
        <p className="text-gray-600">
          SDS, COA ve MSDS belgelerini 3 dilde (Türkçe, İngilizce, Arapça) yükleyin
        </p>
      </div>

      {certificateTypes.map((certType) => (
        <motion.div
          key={certType.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20"
        >
          <div className="flex items-center mb-6">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${certType.color} flex items-center justify-center text-white text-xl shadow-lg mr-4`}>
              {certType.icon}
            </div>
            <div>
              <h4 className="text-xl font-bold text-gray-800">{certType.name}</h4>
              <p className="text-gray-600">{certType.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {languages.map((lang) => {
              const certificate = certificates[certType.key as keyof CertificateUploadForm][lang.key as 'tr' | 'en' | 'ar']
              const dropZoneId = `${certType.key}_${lang.key}`
              const progressKey = `${certType.key}_${lang.key}`
              const progress = uploadProgress[progressKey]
              const isDragOver = dragOver === dropZoneId

              return (
                <motion.div
                  key={lang.key}
                  whileHover={{ scale: 1.02 }}
                  className="space-y-4"
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-2xl">{lang.flag}</span>
                    <span className="font-semibold text-gray-700">{lang.name}</span>
                  </div>

                  {!certificate ? (
                    <div
                      className={`
                        relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300
                        ${isDragOver 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                      onDragOver={(e) => handleDragOver(e, dropZoneId)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, certType.key as keyof CertificateUploadForm, lang.key as 'tr' | 'en' | 'ar')}
                      onClick={() => !disabled && fileInputRefs.current[dropZoneId]?.click()}
                    >
                      <div className="text-4xl mb-3">📄</div>
                      <p className="text-sm text-gray-600 mb-2">
                        PDF dosyasını sürükleyip bırakın veya
                      </p>
                      <p className="text-indigo-600 font-medium text-sm">
                        Dosya Seçin
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Maksimum 10MB
                      </p>
                      
                      <input
                        ref={(el) => fileInputRefs.current[dropZoneId] = el}
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => handleFileInputChange(
                          certType.key as keyof CertificateUploadForm,
                          lang.key as 'tr' | 'en' | 'ar',
                          e
                        )}
                        disabled={disabled}
                      />
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600 text-xl">📄</span>
                          <div>
                            <p className="font-medium text-green-800 text-sm truncate">
                              {certificate.file?.name}
                            </p>
                            <p className="text-green-600 text-xs">
                              {certificate.file ? getFileSize(certificate.file.size) : 'Yükleniyor...'}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeCertificate(
                            certType.key as keyof CertificateUploadForm,
                            lang.key as 'tr' | 'en' | 'ar'
                          )}
                          className="text-red-500 hover:text-red-700 p-1"
                          disabled={disabled}
                        >
                          ❌
                        </motion.button>
                      </div>

                      <AnimatePresence>
                        {progress !== undefined && progress < 100 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full bg-gray-200 rounded-full h-2 mb-2"
                          >
                            <motion.div
                              className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.1 }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {progress === 100 && (
                        <div className="flex items-center text-green-600 text-sm">
                          <span className="mr-1">✅</span>
                          Yükleme tamamlandı
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      ))}

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-blue-50 rounded-xl p-4 border border-blue-200"
      >
        <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
          <span className="mr-2">ℹ️</span>
          Önemli Notlar
        </h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• Sadece PDF formatında dosyalar kabul edilir</li>
          <li>• Maksimum dosya boyutu 10MB'dir</li>
          <li>• Her dil için ayrı ayrı sertifika yükleyebilirsiniz</li>
          <li>• Yüklenen dosyalar otomatik olarak güvenli depolamaya kaydedilir</li>
        </ul>
      </motion.div>
    </div>
  )
}

export default CertificateUpload