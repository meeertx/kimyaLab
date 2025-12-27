// Import API clients
import { apiClient } from './apiClient'
import { ProductsApi } from './productsApi'
import { CategoriesApi } from './categoriesApi'
import { AuthApi } from './authApi'

// Export API clients
export { apiClient, ProductsApi, CategoriesApi, AuthApi }

// Export instances for easier use
const productsApi = new ProductsApi()
const categoriesApi = new CategoriesApi()
const authApi = new AuthApi()

export { productsApi, categoriesApi, authApi }

// Export types from apiClient
export type { PaginatedResponse } from './apiClient'

// Export types from productsApi
export type {
  BackendProduct,
  BackendCategory,
  CreateProductData,
  UpdateProductData,
  ProductFilters,
  PaginationParams
} from './productsApi'

// Export types from categoriesApi
export type {
  CreateCategoryData,
  UpdateCategoryData
} from './categoriesApi'

// Export types from authApi
export type {
  BackendUser,
  LoginCredentials,
  RegisterCredentials,
  LoginResponse,
  AuthUser
} from './authApi'

// Type aliases for better naming
export type { BackendUser as User, AuthUser as FrontendUser } from './authApi'
export type { CreateCategoryData as CategoryCreateData, UpdateCategoryData as CategoryUpdateData } from './categoriesApi'