import { prisma } from '../config/database'
import { Category } from '../types/index'
import {
  NotFoundError,
  ConflictError,
  DatabaseError,
  ValidationError
} from '../middleware/errorHandler'

export class CategoryService {
  // Get all categories (flat list)
  static async getAllCategories(includeInactive = false): Promise<Category[]> {
    try {
      const categories = await prisma.category.findMany({
        where: includeInactive ? {} : { isActive: true },
        orderBy: [
          { order: 'asc' },
          { name: 'asc' }
        ],
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          children: {
            where: includeInactive ? {} : { isActive: true },
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true
            }
          },
          _count: {
            select: {
              products: {
                where: { isActive: true }
              }
            }
          }
        }
      })

      return categories.map(category => this.formatCategoryResponse(category))
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw new DatabaseError('Failed to fetch categories')
    }
  }

  // Get category tree (hierarchical structure)
  static async getCategoryTree(includeInactive = false): Promise<any> {
    try {
      const categories = await this.getAllCategories(includeInactive)
      
      // Build tree structure
      const categoryMap = new Map()
      const rootCategories: any[] = []

      // First pass: create all categories
      categories.forEach(category => {
        categoryMap.set(category.id, {
          ...category,
          children: []
        })
      })

      // Second pass: build tree
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
    } catch (error) {
      console.error('Error building category tree:', error)
      throw new DatabaseError('Failed to build category tree')
    }
  }

  // Get category by ID
  static async getCategoryById(id: string, includeInactive = false): Promise<Category> {
    try {
      const category = await prisma.category.findUnique({
        where: {
          id,
          ...(includeInactive ? {} : { isActive: true })
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          children: {
            where: includeInactive ? {} : { isActive: true },
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true
            },
            orderBy: { order: 'asc' }
          },
          _count: {
            select: {
              products: {
                where: { isActive: true }
              }
            }
          }
        }
      })

      if (!category) {
        throw new NotFoundError('Category not found')
      }

      return this.formatCategoryResponse(category)
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      console.error('Error fetching category by ID:', error)
      throw new DatabaseError('Failed to fetch category')
    }
  }

  // Get category by slug
  static async getCategoryBySlug(slug: string, includeInactive = false): Promise<Category> {
    try {
      const category = await prisma.category.findUnique({
        where: {
          slug,
          ...(includeInactive ? {} : { isActive: true })
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          children: {
            where: includeInactive ? {} : { isActive: true },
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true
            },
            orderBy: { order: 'asc' }
          },
          _count: {
            select: {
              products: {
                where: { isActive: true }
              }
            }
          }
        }
      })

      if (!category) {
        throw new NotFoundError('Category not found')
      }

      return this.formatCategoryResponse(category)
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      console.error('Error fetching category by slug:', error)
      throw new DatabaseError('Failed to fetch category')
    }
  }

  // Get subcategories by parent ID (optimized for dynamic loading)
  static async getSubcategoriesByParentId(parentId: string, includeInactive = false): Promise<Category[]> {
    try {
      const subcategories = await prisma.category.findMany({
        where: {
          parentId: parentId,
          ...(includeInactive ? {} : { isActive: true })
        },
        orderBy: [
          { order: 'asc' },
          { name: 'asc' }
        ],
        include: {
          _count: {
            select: {
              products: {
                where: { isActive: true }
              }
            }
          }
        }
      })

      return subcategories.map(category => this.formatCategoryResponse(category))
    } catch (error) {
      console.error('Error fetching subcategories:', error)
      throw new DatabaseError('Failed to fetch subcategories')
    }
  }

  // Create new category
  static async createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<Category> {
    try {
      // Check if slug already exists
      const existingCategory = await prisma.category.findUnique({
        where: { slug: categoryData.slug }
      })

      if (existingCategory) {
        throw new ConflictError('Category slug already exists')
      }

      // Validate parent category if provided
      if (categoryData.parentId) {
        const parentCategory = await prisma.category.findUnique({
          where: { id: categoryData.parentId }
        })

        if (!parentCategory) {
          throw new ValidationError('Parent category not found')
        }

        if (!parentCategory.isActive) {
          throw new ValidationError('Cannot create subcategory under inactive parent')
        }
      }

      // Get the next order number
      const maxOrder = await prisma.category.aggregate({
        where: { parentId: categoryData.parentId || null },
        _max: { order: true }
      })

      const nextOrder = (maxOrder._max.order || 0) + 1

      const category = await prisma.category.create({
        data: {
          ...categoryData,
          order: categoryData.order || nextOrder
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          children: {
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true
            }
          },
          _count: {
            select: {
              products: {
                where: { isActive: true }
              }
            }
          }
        }
      })

      return this.formatCategoryResponse(category)
    } catch (error) {
      if (error instanceof ConflictError || error instanceof ValidationError) {
        throw error
      }
      console.error('Error creating category:', error)
      throw new DatabaseError('Failed to create category')
    }
  }

  // Update category
  static async updateCategory(
    id: string,
    updateData: Partial<Omit<Category, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Category> {
    try {
      // Check if category exists
      const existingCategory = await prisma.category.findUnique({
        where: { id }
      })

      if (!existingCategory) {
        throw new NotFoundError('Category not found')
      }

      // Check if slug is being updated and already exists
      if (updateData.slug && updateData.slug !== existingCategory.slug) {
        const slugExists = await prisma.category.findUnique({
          where: { slug: updateData.slug }
        })

        if (slugExists) {
          throw new ConflictError('Category slug already exists')
        }
      }

      // Validate parent category if being updated
      if (updateData.parentId !== undefined) {
        if (updateData.parentId === id) {
          throw new ValidationError('Category cannot be its own parent')
        }

        if (updateData.parentId) {
          const parentCategory = await prisma.category.findUnique({
            where: { id: updateData.parentId }
          })

          if (!parentCategory) {
            throw new ValidationError('Parent category not found')
          }

          if (!parentCategory.isActive) {
            throw new ValidationError('Cannot set inactive category as parent')
          }

          // Check for circular dependency
          const isCircular = await this.checkCircularDependency(id, updateData.parentId)
          if (isCircular) {
            throw new ValidationError('Cannot create circular dependency')
          }
        }
      }

      const category = await prisma.category.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          children: {
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true
            },
            orderBy: { order: 'asc' }
          },
          _count: {
            select: {
              products: {
                where: { isActive: true }
              }
            }
          }
        }
      })

      return this.formatCategoryResponse(category)
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ConflictError || error instanceof ValidationError) {
        throw error
      }
      console.error('Error updating category:', error)
      throw new DatabaseError('Failed to update category')
    }
  }

  // Delete category (soft delete)
  static async deleteCategory(id: string): Promise<void> {
    try {
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          children: true,
          _count: {
            select: {
              products: {
                where: { isActive: true }
              }
            }
          }
        }
      })

      if (!category) {
        throw new NotFoundError('Category not found')
      }

      // Check if category has active products
      if (category._count.products > 0) {
        throw new ValidationError('Cannot delete category with active products')
      }

      // Check if category has active children
      const activeChildren = category.children.filter(child => child.isActive)
      if (activeChildren.length > 0) {
        throw new ValidationError('Cannot delete category with active subcategories')
      }

      await prisma.category.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      })
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error
      }
      console.error('Error deleting category:', error)
      throw new DatabaseError('Failed to delete category')
    }
  }

  // Reorder categories
  static async reorderCategories(categoryOrders: { id: string; order: number }[]): Promise<void> {
    try {
      const updatePromises = categoryOrders.map(({ id, order }) =>
        prisma.category.update({
          where: { id },
          data: { order, updatedAt: new Date() }
        })
      )

      await Promise.all(updatePromises)
    } catch (error) {
      console.error('Error reordering categories:', error)
      throw new DatabaseError('Failed to reorder categories')
    }
  }

  // Get category statistics
  static async getCategoryStats(id: string): Promise<any> {
    try {
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              products: true,
              children: true
            }
          }
        }
      })

      if (!category) {
        throw new NotFoundError('Category not found')
      }

      // Get product stats
      const productStats = await prisma.product.aggregate({
        where: { category: category.name },
        _count: { _all: true },
        _sum: { stockQuantity: true },
        _avg: { price: true }
      })

      // Get subcategory stats
      const subcategoryStats = await prisma.category.findMany({
        where: { parentId: id },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      })

      return {
        category: this.formatCategoryResponse(category),
        products: {
          total: productStats._count._all || 0,
          totalStock: productStats._sum.stockQuantity || 0,
          averagePrice: productStats._avg.price || 0
        },
        subcategories: {
          total: category._count.children,
          withProducts: subcategoryStats.filter(sub => sub._count.products > 0).length
        }
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      console.error('Error fetching category stats:', error)
      throw new DatabaseError('Failed to fetch category statistics')
    }
  }

  // Check for circular dependency
  private static async checkCircularDependency(categoryId: string, parentId: string): Promise<boolean> {
    let currentParentId: string | null | undefined = parentId

    while (currentParentId) {
      if (currentParentId === categoryId) {
        return true
      }

      const parent: { parentId: string | null } | null = await prisma.category.findUnique({
        where: { id: currentParentId },
        select: { parentId: true }
      })

      currentParentId = parent?.parentId || null
    }

    return false
  }

  // Format category response
  private static formatCategoryResponse(category: any): Category {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentId: category.parentId,
      imageUrl: category.imageUrl,
      isActive: category.isActive,
      order: category.order,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    }
  }
}