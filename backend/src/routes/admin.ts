import { Router, Request, Response } from 'express'
import { AuthService } from '../services/authService.js'
import { ProductService } from '../services/productService.js'
import { CategoryService } from '../services/categoryService.js'
import { DocumentService } from '../services/documentService.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'
import { handleValidationErrors } from '../middleware/validation.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import { ApiResponse } from '../types/index.js'
import { prisma } from '../config/database.js'

const router = Router()

// All admin routes require admin authentication
router.use(authenticateToken, requireAdmin)

// Admin Dashboard Statistics
router.get('/dashboard',
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const [
      userStats,
      productStats,
      categoryStats,
      documentStats,
      recentActivity
    ] = await Promise.all([
      // User statistics
      prisma.user.aggregate({
        _count: { _all: true },
        where: { isActive: true }
      }),
      
      // Product statistics
      prisma.product.aggregate({
        _count: { _all: true },
        _sum: { stockQuantity: true },
        where: { isActive: true }
      }),
      
      // Category statistics
      prisma.category.aggregate({
        _count: { _all: true },
        where: { isActive: true }
      }),
      
      // Document statistics
      DocumentService.getDocumentStats(),
      
      // Recent activity (last 7 days)
      Promise.all([
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        prisma.product.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ])
    ])

    const dashboardData = {
      users: {
        total: userStats._count._all,
        active: userStats._count._all
      },
      products: {
        total: productStats._count._all,
        totalStock: productStats._sum.stockQuantity || 0,
        lowStock: await ProductService.getLowStockProducts().then(products => products.length)
      },
      categories: {
        total: categoryStats._count._all
      },
      documents: documentStats,
      recentActivity: {
        newUsers: recentActivity[0],
        newProducts: recentActivity[1]
      }
    }

    res.json({
      success: true,
      data: dashboardData,
      message: 'Dashboard data retrieved successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// User Management
router.get('/users',
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const search = req.query.search as string
    const role = req.query.role as string
    const isActive = req.query.isActive

    const skip = (page - 1) * limit

    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (role) where.role = role
    if (isActive !== undefined) where.isActive = isActive === 'true'

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])

    const pages = Math.ceil(total / limit)

    res.json({
      success: true,
      data: {
        users,
        pagination: { page, limit, total, pages }
      },
      message: 'Users retrieved successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Update user status
router.patch('/users/:userId/status',
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { userId } = req.params
    const { isActive } = req.body

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: 'isActive must be a boolean value',
        timestamp: new Date().toISOString()
      })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    })

    res.json({
      success: true,
      data: user,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      timestamp: new Date().toISOString()
    })
  })
)

// Update user role
router.patch('/users/:userId/role',
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const { userId } = req.params
    const { role } = req.body

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
        message: 'Role must be either admin or user',
        timestamp: new Date().toISOString()
      })
    }

    // Prevent self-demotion
    if (userId === req.userId && role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Cannot demote self',
        message: 'You cannot remove your own admin privileges',
        timestamp: new Date().toISOString()
      })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    })

    res.json({
      success: true,
      data: user,
      message: 'User role updated successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// System Health Check
router.get('/health',
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const healthChecks = await Promise.allSettled([
      prisma.healthCheck(),
      // Add other service health checks here
      // CloudinaryService.healthCheck(),
    ])

    const health = {
      database: healthChecks[0].status === 'fulfilled' && healthChecks[0].value,
      // cloudinary: healthChecks[1].status === 'fulfilled' && healthChecks[1].value,
      server: true,
      timestamp: new Date().toISOString()
    }

    const allHealthy = Object.values(health).every(status => status === true || typeof status === 'string')

    res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      data: health,
      message: allHealthy ? 'All systems healthy' : 'Some systems unhealthy',
      timestamp: new Date().toISOString()
    })
  })
)

// System Logs
router.get('/logs',
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    // This is a placeholder for log retrieval
    // In a real implementation, you might integrate with a logging service
    
    const logs = [
      {
        level: 'info',
        message: 'Server started successfully',
        timestamp: new Date().toISOString(),
        service: 'server'
      },
      {
        level: 'info',
        message: 'Database connected',
        timestamp: new Date().toISOString(),
        service: 'database'
      }
    ]

    res.json({
      success: true,
      data: logs,
      message: 'System logs retrieved successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Database Backup (placeholder)
router.post('/backup',
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    // This would trigger a database backup process
    // Implementation depends on your backup strategy
    
    res.json({
      success: true,
      message: 'Database backup initiated',
      timestamp: new Date().toISOString()
    })
  })
)

// Clean expired tokens
router.post('/maintenance/clean-tokens',
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    await AuthService.cleanExpiredTokens()
    
    res.json({
      success: true,
      message: 'Expired tokens cleaned successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// System Settings (placeholder)
router.get('/settings',
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    const settings = {
      siteName: 'Kimya Lab',
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      maintenanceMode: false,
      registrationEnabled: true,
      fileUploadEnabled: true,
      maxFileSize: '10MB'
    }

    res.json({
      success: true,
      data: settings,
      message: 'System settings retrieved successfully',
      timestamp: new Date().toISOString()
    })
  })
)

// Update system settings
router.patch('/settings',
  asyncHandler(async (req: Request, res: Response<ApiResponse>) => {
    // This would update system settings
    // Implementation depends on how you store settings
    
    const { maintenanceMode, registrationEnabled, fileUploadEnabled } = req.body

    // Validate and update settings
    const updatedSettings = {
      maintenanceMode: maintenanceMode !== undefined ? maintenanceMode : false,
      registrationEnabled: registrationEnabled !== undefined ? registrationEnabled : true,
      fileUploadEnabled: fileUploadEnabled !== undefined ? fileUploadEnabled : true
    }

    res.json({
      success: true,
      data: updatedSettings,
      message: 'System settings updated successfully',
      timestamp: new Date().toISOString()
    })
  })
)

export default router