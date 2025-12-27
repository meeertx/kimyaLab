// Enhanced Product related types

// Technical specification for products
export interface TechnicalSpec {
  name: string
  value: string
  unit?: string
}

export interface Product {
  // Temel Bilgiler
  id: string
  name: string
  nameEn?: string
  nameAr?: string
  productCode?: string
  code?: string
  brand?: string
  
  // Kimyasal Bilgiler
  cas?: string
  formula?: string
  molecularWeight?: string
  purity?: string
  grade?: string
  
  // Backend Technical Specs (from admin form)
  technicalSpecs?: TechnicalSpec[]
  
  // Formülasyon Bilgileri
  formulation?: FormulationComponent[]
  
  // Ambalaj Seçenekleri
  packaging?: PackagingOption[]
  
  // Saklama Koşulları
  storageConditions?: StorageConditions
  
  // Fiyat ve Stok
  price: number | string
  currency?: string
  unit?: string
  stock?: boolean
  stockQuantity?: number
  minStockLevel?: number
  
  // Kategorilendirme
  category?: CategoryKey | string
  subcategory?: string
  subcategoryId?: string
  categoryId?: string
  
  // Açıklama
  description?: string
  descriptionEn?: string
  descriptionAr?: string
  
  // Kullanım Alanları
  applications?: string[]
  usageAreas?: string[]
  
  // Teknik Özellikler
  specifications?: ProductSpecifications
  
  // Belgeler
  documents?: ProductDocument[]
  
  // Görseller
  images?: ProductImage[]
  thumbnailImage?: string
  
  // Arama İçin Özel Alanlar
  searchableFields?: SearchableFields
  
  // Meta
  tags?: string[]
  featured?: boolean
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

// Formülasyon bileşeni
export interface FormulationComponent {
  id: string
  component: string
  casNumber?: string
  amount: string
  unit: string
  percentage?: number
  function?: string
}

// Ambalaj seçeneği
export interface PackagingOption {
  id: string
  type: string
  material?: string
  size: string
  quantity: number
  unit: string
  price: number
  minOrderQuantity?: number
  availability: boolean
}

// Saklama koşulları
export interface StorageConditions {
  temperature: {
    min?: number
    max?: number
    unit: 'C' | 'F'
    description: string
  }
  humidity?: {
    max: number
    description: string
  }
  lightConditions: 'dark' | 'ambient' | 'protected'
  atmosphere?: string
  specialRequirements: string[]
  shelfLife: {
    duration: number
    unit: 'months' | 'years'
    conditions: string
  }
  incompatibleWith?: string[]
}

// Ürün görseli
export interface ProductImage {
  id: string
  url: string
  type: 'main' | 'gallery' | 'thumbnail' | 'technical'
  alt: string
  order: number
}

// Arama için özel alanlar
export interface SearchableFields {
  serialNumber?: string
  modelNumber?: string
  alternativeNames: string[]
  synonyms: string[]
  tags: string[]
}

export interface ProductSpecifications {
  // Fiziksel Özellikler
  appearance: string
  color?: string
  odor?: string
  state: 'solid' | 'liquid' | 'gas' | 'powder'
  
  // Kimyasal Özellikler
  solubility?: SolubilityInfo[]
  meltingPoint?: string
  boilingPoint?: string
  density?: string
  ph?: string
  viscosity?: string
  flashPoint?: string
  
  // Biyolojik Özellikler
  sterility?: 'sterile' | 'non-sterile' | 'aseptic'
  endotoxinLevel?: string
  biocompatibility?: string
  
  // Analitik Özellikler
  assay?: string
  impurities?: ImpurityInfo[]
  
  // Kullanım Talimatları
  usageInstructions?: string
  
  [key: string]: any
}

export interface SolubilityInfo {
  solvent: string
  value: string
  conditions?: string
}

export interface ImpurityInfo {
  type: string
  limit: string
}

export interface ProductDocument {
  id: string
  name: string
  description?: string
  type: 'SDS' | 'COA' | 'MSDS' | 'TDS' | 'BROCHURE' | 'MANUAL' | 'REGULATORY'
  fileType: 'PDF' | 'DOC' | 'XLS' | 'TXT'
  size: string
  url: string
  language: 'tr' | 'en' | 'ar'
  version?: string
  uploadDate: string
  expiryDate?: string
  isActive: boolean
  // Kimyasal sertifika özel alanları
  chemicalName?: string
  hazardClassification?: string[]
  regulatoryCompliance?: string[]
}

// Kimyasal sertifika upload sistemi için özel tipler
export interface ChemicalCertificate {
  id: string
  productId: string
  certificateType: 'SDS' | 'COA' | 'MSDS'
  language: 'tr' | 'en' | 'ar'
  file: File | null
  url?: string
  version: string
  issuedDate: string
  expiryDate?: string
  issuedBy?: string
  isActive: boolean
  uploadedAt: string
  uploadedBy: string
}

export interface CertificateUploadForm {
  sds: {
    tr: ChemicalCertificate | null
    en: ChemicalCertificate | null
    ar: ChemicalCertificate | null
  }
  coa: {
    tr: ChemicalCertificate | null
    en: ChemicalCertificate | null
    ar: ChemicalCertificate | null
  }
  msds: {
    tr: ChemicalCertificate | null
    en: ChemicalCertificate | null
    ar: ChemicalCertificate | null
  }
}

// Category types
export type CategoryKey = 'chemicals' | 'life_sciences' | 'raw_materials' | 'applications'

export interface Category {
  id: CategoryKey
  name: string
  nameEn: string
  nameAr: string
  description: string
  descriptionEn: string
  descriptionAr: string
  slug: string
  icon: string
  subcategories: Subcategory[]
  productCount: number
  featured: boolean
}

export interface Subcategory {
  id: string
  name: string
  nameEn: string
  nameAr: string
  slug: string
  categoryId: CategoryKey
  productCount: number
}

// Enhanced Search and Filter types
export interface SearchFilters {
  query?: string
  category?: CategoryKey
  subcategory?: string
  brand?: string
  priceRange?: {
    min: number
    max: number
  }
  inStock?: boolean
  tags?: string[]
  grade?: string
  cas?: string
}

export interface FlexibleSearchOptions {
  fields: SearchField[]
  fuzzyTolerance: number
  minScore: number
  maxResults: number
  enableSynonyms: boolean
  enablePartialMatching: boolean
}

export interface SearchField {
  name: string
  type: 'text' | 'number' | 'code' | 'formula'
  weight: number
  searchable: boolean
}

export interface SearchResult extends Product {
  score: number
  matchedFields: string[]
}

export interface SearchResult {
  products: Product[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  filters: SearchFilters
}

export interface SortOption {
  key: string
  label: string
  labelEn: string
  labelAr: string
}

// Cart types
export interface CartItem {
  productId: string
  product: Product
  quantity: number
  unitPrice: number
  totalPrice: number
  addedAt: string
}

export interface Cart {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  currency: string
}

// User types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  company?: string
  phone?: string
  address?: Address
  preferences: UserPreferences
  createdAt: string
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface UserPreferences {
  language: 'tr' | 'en' | 'ar'
  currency: string
  notifications: boolean
  newsletter: boolean
}

// API response types
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
  meta?: {
    page?: number
    pageSize?: number
    totalCount?: number
    totalPages?: number
  }
}

// Component props types
export interface ProductCardProps {
  product: Product
  showCategory?: boolean
  showAddToCart?: boolean
  showCompare?: boolean
  className?: string
}

export interface CategoryCardProps {
  category: Category
  showProductCount?: boolean
  className?: string
}

export interface FilterSidebarProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  categories: Category[]
  brands: string[]
  priceRange: {
    min: number
    max: number
  }
}