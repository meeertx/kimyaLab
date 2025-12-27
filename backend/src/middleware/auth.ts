import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/config.js'
import { prisma } from '../config/database.js'
import { ApiResponse, User } from '../types/index.js'

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: Omit<User, 'password'>
      userId?: string
    }
  }
}

export interface JWTPayload {
  userId: string
  email: string
  role: string
  iat?: number
  exp?: number
}

export const authenticateToken = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required',
        message: 'Please provide a valid access token',
        timestamp: new Date().toISOString()
      })
      return
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Invalid or inactive user',
        message: 'User account is not active or does not exist',
        timestamp: new Date().toISOString()
      })
      return
    }

    req.user = user
    req.userId = user.id
    next()
  } catch (error) {
    console.error('Authentication error:', error)
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'The provided token is invalid',
        timestamp: new Date().toISOString()
      })
      return
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'The provided token has expired',
        timestamp: new Date().toISOString()
      })
      return
    }

    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'An error occurred during authentication',
      timestamp: new Date().toISOString()
    })
  }
}

export const requireAdmin = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Please authenticate first',
      timestamp: new Date().toISOString()
    })
    return
  }

  if (req.user.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      error: 'Admin access required',
      message: 'This action requires admin privileges',
      timestamp: new Date().toISOString()
    })
    return
  }

  next()
}

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (!token) {
      next()
      return
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (user && user.isActive) {
      req.user = user
      req.userId = user.id
    }

    next()
  } catch (error) {
    // If token is invalid, continue without user
    next()
  }
}