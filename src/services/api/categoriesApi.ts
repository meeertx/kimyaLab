import { apiClient } from './apiClient'

// Backend category types (matching backend schema)
export interface BackendCategory {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  imageUrl: string | null
  isActive: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface CategoryStats {
  category: BackendCategory
  products: {
    total: number
    totalStock: number
    averagePrice: number
  }
  subcategories: {
    total: number
    withProducts: number
  }
}

export interface CreateCategoryData {
  name: string
  slug: string
  description?: string
  parentId?: string
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {}

export class CategoriesApi {
  // Get all categories
  static async getCategories(includeInactive = false): Promise<BackendCategory[]> {
    const params = includeInactive ? { includeInactive: 'true' } : {}
    const response = await apiClient.get<BackendCategory[]>('/categories', params)
    return response.data!
  }

  // Get category tree (hierarchical structure)
  static async getCategoryTree(includeInactive = false): Promise<any> {
    const params = includeInactive ? { includeInactive: 'true' } : {}
    const response = await apiClient.get('/categories/tree', params)
    return response.data!
  }

  // Get subcategories by parent ID or slug (optimized for dynamic loading)
  static async getSubcategoriesByParentId(parentIdentifier: string, includeInactive = false): Promise<BackendCategory[]> {
    const params = includeInactive ? { includeInactive: 'true' } : {}
    const response = await apiClient.get<BackendCategory[]>(`/categories/parent/${parentIdentifier}/subcategories`, params)
    return response.data!
  }

  // Get main categories only (categories without parent)
  static async getMainCategories(includeInactive = false): Promise<BackendCategory[]> {
    const allCategories = await this.getCategories(includeInactive)
    return allCategories.filter(cat => !cat.parentId)
  }

  // Get category by ID
  static async getCategoryById(id: string): Promise<BackendCategory> {
    const response = await apiClient.get<BackendCategory>(`/categories/${id}`)
    return response.data!
  }

  // Get category by slug
  static async getCategoryBySlug(slug: string): Promise<BackendCategory> {
    const response = await apiClient.get<BackendCategory>(`/categories/${slug}`)
    return response.data!
  }

  // Create new category (Admin only)
  static async createCategory(categoryData: Omit<BackendCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<BackendCategory> {
    const response = await apiClient.post<BackendCategory>('/categories', categoryData)
    return response.data!
  }

  // Update category (Admin only)
  static async updateCategory(id: string, updates: Partial<BackendCategory>): Promise<BackendCategory> {
    const response = await apiClient.put<BackendCategory>(`/categories/${id}`, updates)
    return response.data!
  }

  // Delete category (Admin only)
  static async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`)
  }

  // Reorder categories (Admin only)
  static async reorderCategories(categoryOrders: { id: string; order: number }[]): Promise<void> {
    await apiClient.patch('/categories/reorder', { categoryOrders })
  }

  // Get category statistics (Admin only)
  static async getCategoryStats(id: string): Promise<CategoryStats> {
    const response = await apiClient.get<CategoryStats>(`/categories/${id}/stats`)
    return response.data!
  }

  // Convert backend category to frontend category format
  static convertToFrontendCategory(backendCategory: BackendCategory): any {
    return {
      id: backendCategory.id,
      name: backendCategory.name,
      slug: backendCategory.slug,
      description: backendCategory.description || '',
      parentId: backendCategory.parentId,
      imageUrl: backendCategory.imageUrl,
      isActive: backendCategory.isActive,
      order: backendCategory.order,
      createdAt: backendCategory.createdAt,
      updatedAt: backendCategory.updatedAt,
      // Additional mappings for frontend compatibility
      icon: '🧪', // Default icon
      color: '#3B82F6', // Default color
      featured: false // Default value
    }
  }

  // Batch convert backend categories to frontend format
  static convertToFrontendCategories(backendCategories: BackendCategory[]): any[] {
    return backendCategories.map(this.convertToFrontendCategory)
  }

  // Build hierarchical tree from flat category list
  static buildCategoryTree(categories: BackendCategory[]): any[] {
    const categoryMap = new Map()
    const rootCategories: any[] = []

    // First pass: create all categories
    categories.forEach(category => {
      const convertedCategory = this.convertToFrontendCategory(category)
      categoryMap.set(category.id, {
        ...convertedCategory,
        children: []
      })
    })

    // Second pass: build tree structure
    categories.forEach(category => {
      const categoryNode = categoryMap.get(category.id)
      
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId)
        if (parent) {
          parent.children.push(categoryNode)
        }
      } else {
        rootCategories.push(categoryNode)
      }
    })

    return rootCategories
  }
}