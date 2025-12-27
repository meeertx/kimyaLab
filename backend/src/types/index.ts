import { User, UserRole, Product, Category, Document, Inventory, AuthToken } from '@prisma/client'

// Safe User Type (without password)
export type SafeUser = Omit<User, 'password'>

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface LoginResponse {
  user: SafeUser
  accessToken: string
  refreshToken: string
}

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
  iat?: number
  exp?: number
}

// Technical Specs Type
export interface TechnicalSpec {
  name: string
  value: string
  unit?: string
}

// Filter and Query Types
export interface ProductFilter {
  category?: string
  subCategory?: string
  priceMin?: number
  priceMax?: number
  inStock?: boolean
  search?: string
  isActive?: boolean
}

export interface CategoryFilter {
  parentId?: string
  isActive?: boolean
}

export interface PaginationQuery {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Socket.io Event Types
export interface SocketEvents {
  // Client to Server
  join_room: (room: string) => void
  leave_room: (room: string) => void
  
  // Server to Client
  product_updated: (product: Product) => void
  inventory_updated: (inventory: Inventory) => void
  new_user_registered: (user: SafeUser) => void
  system_notification: (message: string) => void
}

// File Upload Types
export interface FileUploadResult {
  url: string
  publicId: string
  originalName: string
  size: number
  mimeType: string
  // Optional Cloudinary metadata
  width?: number
  height?: number
  format?: string
  resourceType?: string
  createdAt?: string
  bytes?: number
}

export interface MultipleFileUploadResult {
  files: FileUploadResult[]
  failed: string[]
}

// Error Types
export interface ErrorResponse {
  error: string
  message: string
  statusCode: number
  timestamp: string
  details?: any
}

// Configuration Types
export interface DatabaseConfig {
  url: string
  maxConnections?: number
  connectionTimeout?: number
}

export interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
  folder: string
}

export interface JWTConfig {
  secret: string
  expiresIn: string
  refreshSecret: string
  refreshExpiresIn: string
}

export interface ServerConfig {
  port: number
  cors: {
    origin: string[]
    credentials: boolean
  }
  rateLimit: {
    windowMs: number
    max: number
  }
}

// Export Prisma Types
export {
  User,
  UserRole,
  Product,
  Category,
  Document,
  Inventory,
  AuthToken
}

// Request Extensions
declare global {
  namespace Express {
    interface Request {
      user?: SafeUser
    }
  }
}