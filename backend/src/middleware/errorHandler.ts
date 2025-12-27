import { Request, Response, NextFunction } from 'express'
import { ApiResponse, ErrorResponse } from '../types/index.js'
import { config } from '../config/config.js'

export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    
    Error.captureStackTrace(this, this.constructor)
  }
}

// Custom error types
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409)
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500)
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service error') {
    super(message, 502)
  }
}

// Handle Prisma errors
const handlePrismaError = (error: any): AppError => {
  if (error.code === 'P2002') {
    // Unique constraint failed
    const field = error.meta?.target?.[0] || 'field'
    return new ConflictError(`${field} already exists`)
  }
  
  if (error.code === 'P2025') {
    // Record not found
    return new NotFoundError('Record not found')
  }
  
  if (error.code === 'P2003') {
    // Foreign key constraint failed
    return new ValidationError('Invalid reference to related record')
  }
  
  if (error.code === 'P2021') {
    // Table does not exist
    return new DatabaseError('Database table not found')
  }
  
  return new DatabaseError(`Database error: ${error.message}`)
}

// Handle validation errors
const handleValidationError = (error: any): AppError => {
  const messages = Object.values(error.errors || {}).map((err: any) => err.message)
  return new ValidationError(`Validation failed: ${messages.join(', ')}`)
}

// Handle JWT errors
const handleJWTError = (): AppError => {
  return new AuthenticationError('Invalid token')
}

const handleJWTExpiredError = (): AppError => {
  return new AuthenticationError('Token expired')
}

// Handle Multer errors
const handleMulterError = (error: any): AppError => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new ValidationError('File size too large')
  }
  if (error.code === 'LIMIT_FILE_COUNT') {
    return new ValidationError('Too many files')
  }
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ValidationError('Unexpected file field')
  }
  return new ValidationError(`File upload error: ${error.message}`)
}

// Main error handler
export const errorHandler = (
  error: any,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): void => {
  let err: AppError

  // Handle known error types
  if (error instanceof AppError) {
    err = error
  } else if (error.name === 'PrismaClientKnownRequestError') {
    err = handlePrismaError(error)
  } else if (error.name === 'ValidationError') {
    err = handleValidationError(error)
  } else if (error.name === 'JsonWebTokenError') {
    err = handleJWTError()
  } else if (error.name === 'TokenExpiredError') {
    err = handleJWTExpiredError()
  } else if (error.name === 'MulterError') {
    err = handleMulterError(error)
  } else {
    // Unknown error
    err = new AppError(
      config.env === 'production' ? 'Something went wrong' : error.message,
      500,
      false
    )
  }

  // Log error details
  console.error('Error occurred:', {
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  })

  // Send error response
  const response: ErrorResponse = {
    error: err.message,
    message: err.message,
    statusCode: err.statusCode,
    timestamp: new Date().toISOString()
  }

  // Include stack trace in development
  if (config.env === 'development' && !err.isOperational) {
    response.details = {
      stack: err.stack,
      original: error.message
    }
  }

  res.status(err.statusCode).json(response)
}

// 404 handler
export const notFoundHandler = (
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
): void => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`)
  next(error)
}

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}