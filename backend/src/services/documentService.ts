import { prisma } from '../config/database'
import { Document, PaginatedResponse, PaginationQuery } from '../types/index'
import {
  NotFoundError,
  DatabaseError,
  ValidationError
} from '../middleware/errorHandler'

export interface DocumentFilter {
  type?: string
  productId?: string
  categoryId?: string
  isPublic?: boolean
  uploadedBy?: string
}

export class DocumentService {
  // Create new document
  static async createDocument(documentData: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document> {
    try {
      const document = await prisma.document.create({
        data: {
          ...documentData,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      return this.formatDocumentResponse(document)
    } catch (error) {
      console.error('Error creating document:', error)
      throw new DatabaseError('Failed to create document')
    }
  }

  // Get document by ID
  static async getDocumentById(id: string): Promise<Document> {
    try {
      const document = await prisma.document.findUnique({
        where: { id },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      if (!document) {
        throw new NotFoundError('Document not found')
      }

      return this.formatDocumentResponse(document)
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      console.error('Error fetching document:', error)
      throw new DatabaseError('Failed to fetch document')
    }
  }

  // Get all documents with filtering and pagination
  static async getAllDocuments(
    filters: DocumentFilter = {},
    pagination: PaginationQuery = {}
  ): Promise<PaginatedResponse<Document>> {
    try {
      const {
        type,
        productId,
        categoryId,
        isPublic,
        uploadedBy
      } = filters

      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = pagination

      const skip = (page - 1) * limit

      // Build where clause
      const where: any = {}

      if (type) where.type = type
      if (productId) where.productId = productId
      if (categoryId) where.categoryId = categoryId
      if (isPublic !== undefined) where.isPublic = isPublic
      if (uploadedBy) where.uploadedBy = uploadedBy

      // Build orderBy clause
      const orderBy: any = {}
      if (['createdAt', 'updatedAt', 'name', 'fileSize'].includes(sortBy)) {
        orderBy[sortBy] = sortOrder
      } else {
        orderBy.createdAt = 'desc'
      }

      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        prisma.document.count({ where })
      ])

      const pages = Math.ceil(total / limit)

      return {
        data: documents.map(doc => this.formatDocumentResponse(doc)),
        pagination: {
          page,
          limit,
          total,
          pages
        }
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      throw new DatabaseError('Failed to fetch documents')
    }
  }

  // Get user's documents
  static async getUserDocuments(
    userId: string,
    pagination: PaginationQuery = {}
  ): Promise<PaginatedResponse<Document>> {
    return this.getAllDocuments({ uploadedBy: userId }, pagination)
  }

  // Get documents by product
  static async getProductDocuments(
    productId: string,
    includePrivate = false,
    pagination: PaginationQuery = {}
  ): Promise<PaginatedResponse<Document>> {
    const filters: DocumentFilter = {
      productId,
      ...(includePrivate ? {} : { isPublic: true })
    }

    return this.getAllDocuments(filters, pagination)
  }

  // Get documents by category
  static async getCategoryDocuments(
    categoryId: string,
    includePrivate = false,
    pagination: PaginationQuery = {}
  ): Promise<PaginatedResponse<Document>> {
    const filters: DocumentFilter = {
      categoryId,
      ...(includePrivate ? {} : { isPublic: true })
    }

    return this.getAllDocuments(filters, pagination)
  }

  // Update document
  static async updateDocument(
    id: string,
    updateData: Partial<Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'uploadedBy'>>
  ): Promise<Document> {
    try {
      const existingDocument = await prisma.document.findUnique({
        where: { id }
      })

      if (!existingDocument) {
        throw new NotFoundError('Document not found')
      }

      // Validate product if being updated
      if (updateData.productId) {
        const product = await prisma.product.findUnique({
          where: { id: updateData.productId }
        })

        if (!product) {
          throw new ValidationError('Product not found')
        }
      }

      // Validate category if being updated
      if (updateData.categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: updateData.categoryId }
        })

        if (!category) {
          throw new ValidationError('Category not found')
        }
      }

      const document = await prisma.document.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        },
        include: {
          uploader: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      return this.formatDocumentResponse(document)
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error
      }
      console.error('Error updating document:', error)
      throw new DatabaseError('Failed to update document')
    }
  }

  // Delete document
  static async deleteDocument(id: string): Promise<void> {
    try {
      const document = await prisma.document.findUnique({
        where: { id }
      })

      if (!document) {
        throw new NotFoundError('Document not found')
      }

      await prisma.document.delete({
        where: { id }
      })
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error
      }
      console.error('Error deleting document:', error)
      throw new DatabaseError('Failed to delete document')
    }
  }

  // Search documents
  static async searchDocuments(
    query: string,
    filters: DocumentFilter = {},
    pagination: PaginationQuery = {}
  ): Promise<PaginatedResponse<Document>> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = pagination

      const skip = (page - 1) * limit

      // Build search where clause
      const where: any = {
        AND: [
          // Apply filters
          ...(filters.type ? [{ type: filters.type }] : []),
          ...(filters.productId ? [{ productId: filters.productId }] : []),
          ...(filters.categoryId ? [{ categoryId: filters.categoryId }] : []),
          ...(filters.isPublic !== undefined ? [{ isPublic: filters.isPublic }] : []),
          ...(filters.uploadedBy ? [{ uploadedBy: filters.uploadedBy }] : []),
          
          // Search in name and filename
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { fileName: { contains: query, mode: 'insensitive' } }
            ]
          }
        ]
      }

      const orderBy: any = {}
      if (['createdAt', 'updatedAt', 'name', 'fileSize'].includes(sortBy)) {
        orderBy[sortBy] = sortOrder
      } else {
        orderBy.createdAt = 'desc'
      }

      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            uploader: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        prisma.document.count({ where })
      ])

      const pages = Math.ceil(total / limit)

      return {
        data: documents.map(doc => this.formatDocumentResponse(doc)),
        pagination: {
          page,
          limit,
          total,
          pages
        }
      }
    } catch (error) {
      console.error('Error searching documents:', error)
      throw new DatabaseError('Failed to search documents')
    }
  }

  // Get document statistics
  static async getDocumentStats(): Promise<any> {
    try {
      const [totalCount, typeStats, sizeStats, recentStats] = await Promise.all([
        prisma.document.count(),
        prisma.document.groupBy({
          by: ['type'],
          _count: { _all: true }
        }),
        prisma.document.aggregate({
          _sum: { fileSize: true },
          _avg: { fileSize: true },
          _max: { fileSize: true }
        }),
        prisma.document.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          }
        })
      ])

      return {
        total: totalCount,
        byType: typeStats.reduce((acc: any, stat) => {
          acc[stat.type] = stat._count._all
          return acc
        }, {}),
        storage: {
          totalSize: sizeStats._sum.fileSize || 0,
          averageSize: sizeStats._avg.fileSize || 0,
          maxSize: sizeStats._max.fileSize || 0
        },
        recentUploads: recentStats
      }
    } catch (error) {
      console.error('Error fetching document stats:', error)
      throw new DatabaseError('Failed to fetch document statistics')
    }
  }

  // Format document response
  private static formatDocumentResponse(document: any): Document {
    return {
      id: document.id,
      name: document.name,
      type: document.type,
      fileUrl: document.fileUrl,
      fileName: document.fileName,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      productId: document.productId,
      categoryId: document.categoryId,
      isPublic: document.isPublic,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      uploadedBy: document.uploadedBy
    }
  }
}